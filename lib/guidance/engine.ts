import { addDays } from 'date-fns';
import type { OperationalGoal, SmartBucket } from '@prisma/client';
import { JobStatus, OperationalGoalKind, OperationalGoalStatus } from '@prisma/client';
import type { RiskFindingDto } from '@/lib/cashflow/types';
import { getLowBalanceThresholdUsd } from '@/lib/cashflow/constants';
import { buildCashFlowForecast } from '@/lib/cashflow/forecast';
import { prisma } from '@/lib/prisma';
import { analyzeOperationalGoal } from '@/lib/goals/analyze';
import type { AutomationClientAction } from '@/lib/financial-automation/actionable-metadata';
import type { GuidanceLogicalKind, GuidancePriorityLevel, GuidanceRecommendation } from '@/lib/guidance/types';

/** Exported for unit tests — maps forecast risk codes to guidance taxonomy. */
export function riskCodeToGuidanceKind(code: RiskFindingDto['code']): GuidanceLogicalKind {
  switch (code) {
    case 'PROJECTED_LOW_BALANCE':
      return 'CASH_FLOW_SAFETY';
    case 'BILLS_BEFORE_NEXT_INCOME':
    case 'BILL_CLUSTER':
      return 'BILL_TIMING';
    case 'ALLOCATION_PRESSURE':
      return 'ALLOCATION_ADJUSTMENT';
    case 'INVOICE_RECEIVABLE_GAP':
      return 'INVOICE_FOLLOWUP';
    case 'DEPOSIT_RUNWAY_WARNING':
      return 'CONTRACTOR_RESERVE';
    default:
      return 'CASH_FLOW_SAFETY';
  }
}

export function riskSeverityToGuidancePriority(severity: RiskFindingDto['severity']): GuidancePriorityLevel {
  if (severity === 'critical') return 'critical';
  if (severity === 'warning') return 'high';
  return 'medium';
}

function baseMoneyActions(kind: GuidanceLogicalKind): AutomationClientAction[] {
  const actions: AutomationClientAction[] = [{ type: 'OPEN_CASH_FLOW' }];
  if (kind === 'ALLOCATION_ADJUSTMENT') {
    actions.push({ type: 'OPEN_MONEY_CONTROL', tab: 'rules' }, { type: 'OPEN_MONEY_CONTROL', tab: 'buckets' });
  } else {
    actions.push({ type: 'OPEN_MONEY_CONTROL', tab: 'review' });
  }
  return actions;
}

function forecastRiskToRecommendation(r: RiskFindingDto): GuidanceRecommendation {
  const logicalKind = riskCodeToGuidanceKind(r.code);
  const priority = riskSeverityToGuidancePriority(r.severity);
  return {
    attentionKey: `${logicalKind}_${r.code}`,
    logicalKind,
    priority,
    title: `Guidance · ${r.summary}`,
    body: r.detail,
    sourceRiskCode: r.code,
    clientActions: baseMoneyActions(logicalKind),
    explain: {
      why: `Triggered from deterministic cash flow risk "${r.code}" (${r.severity}).`,
      dataInfluences: [
        'buildCashFlowForecast → analyzeRisks',
        'Ledger-derived recurrence, RecurringBill rows, unpaid invoices, SmartAllocation trailing pace',
      ],
      calculations: [
        `Risk confidence from model: ${(r.confidence * 100).toFixed(0)}% (see cash flow explain for dataset confidence).`,
        r.detail,
      ],
      expectedImpact:
        logicalKind === 'ALLOCATION_ADJUSTMENT'
          ? 'Adjusting automation allocation or envelope targets can raise projected minimum balances in the next refresh.'
          : 'Following cash timing, invoicing, or reserve actions can improve the next deterministic forecast run.',
      confidence: r.confidence,
    },
  };
}

export type GuidanceEngineResult = {
  recommendations: GuidanceRecommendation[];
  forecastSnapshot: {
    generatedAt: string;
    inputsUsed: Record<string, number | string | string[]>;
    riskCodes: string[];
  };
};

/**
 * Deterministic operational guidance — composes forecast risks, goals, invoices, guardrails.
 * Does not call external AI.
 */
export async function buildGuidanceRecommendations(userId: string): Promise<GuidanceEngineResult> {
  const forecast = await buildCashFlowForecast(userId, { includeDetails: true });

  const recs: GuidanceRecommendation[] = [];
  for (const r of forecast.risks) {
    recs.push(forecastRiskToRecommendation(r));
  }

  const forecastSnapshot = {
    generatedAt: forecast.generatedAt,
    inputsUsed: forecast.explain.inputsUsed,
    riskCodes: forecast.risks.map(x => x.code),
  };

  const activeGoals = await prisma.operationalGoal.findMany({
    where: { userId, status: OperationalGoalStatus.ACTIVE },
    include: { smartBucket: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });

  const analyses: { goal: OperationalGoal & { smartBucket: SmartBucket }; behindPace: boolean; allocConflict: boolean }[] =
    [];
  for (const g of activeGoals) {
    const a = await analyzeOperationalGoal(userId, g, { forecast });
    analyses.push({
      goal: g,
      behindPace: a.findings.some(f => f.code === 'MISSED_TARGET_PACE'),
      allocConflict: a.findings.some(f => f.code === 'ALLOCATION_PRESSURE_CONFLICT'),
    });
  }

  const behindNames = analyses.filter(x => x.behindPace).map(x => x.goal.name);
  if (behindNames.length >= 2) {
    recs.push({
      attentionKey: 'GOAL_PACING_MULTI_BEHIND',
      logicalKind: 'GOAL_PACING',
      priority: 'high',
      title: 'Guidance · Multiple goals are behind required pace',
      body: `These active goals trail their deterministic pace: ${behindNames.join(', ')}. Increase contributions, extend deadlines, or reprioritize envelopes.`,
      clientActions: [
        { type: 'OPEN_CASH_FLOW' },
        { type: 'OPEN_OPERATIONAL_GOAL', goalId: analyses.find(x => x.behindPace)!.goal.id },
        { type: 'OPEN_MONEY_CONTROL', tab: 'buckets' },
      ],
      explain: {
        why: 'Two or more OperationalGoal rows have MISSED_TARGET_PACE from lib/goals/analyze (trailing 30d SmartAllocation vs required daily).',
        dataInfluences: [
          'OperationalGoal + SmartBucket.currentAmount',
          'SmartAllocation rows with source OPERATIONAL_GOAL:{id}',
          'buildCashFlowForecast 30d allocation drag',
        ],
        calculations: [
          'requiredAverageDaily = remaining / daysRemaining',
          'trailing30DayAverageDailyContribution = sum(goal allocations last 30d) / 30',
        ],
        expectedImpact: 'Pausing or deprioritizing one goal can restore pace on higher-priority goals without new ledger features.',
        confidence: 0.7,
      },
    });
  }

  const hasAllocPressure = forecast.risks.some(x => x.code === 'ALLOCATION_PRESSURE');
  if (hasAllocPressure && analyses.some(x => x.allocConflict)) {
    recs.push({
      attentionKey: 'SYNTH_ALLOC_GOAL_TRADEOFF',
      logicalKind: 'ALLOCATION_ADJUSTMENT',
      priority: 'high',
      title: 'Guidance · Envelope drag conflicts with goal pace',
      body: 'Allocation pressure from trailing SmartAllocations overlaps with at least one goal that already exceeds forecasted daily drag. Reduce rule percentages, pause a goal, or raise income before increasing contributions.',
      clientActions: [
        { type: 'OPEN_CASH_FLOW' },
        { type: 'OPEN_MONEY_CONTROL', tab: 'rules' },
        { type: 'OPEN_MONEY_CONTROL', tab: 'buckets' },
        { type: 'OPEN_OPERATIONAL_GOAL', goalId: analyses.find(x => x.allocConflict)!.goal.id },
      ],
      explain: {
        why: 'Composite of ALLOCATION_PRESSURE (cashflow risk) and ALLOCATION_PRESSURE_CONFLICT (goal analyzer).',
        dataInfluences: ['analyzeRisks ALLOCATION_PRESSURE heuristic', 'Goal analyze forecastDailyAllocationDrag30d vs requiredAverageDaily'],
        calculations: [
          'ALLOCATION_PRESSURE when lowest projected balance < startingBalance - 2× weekly allocation estimate (see risk.ts).',
          'Goal conflict when requiredAverageDaily > 1.22 × forecastDailyAllocationDrag30d.',
        ],
        expectedImpact: 'Tightening automation allocation rules increases modeled liquid balance; pausing goals reduces required daily funding.',
        confidence: 0.68,
      },
    });
  }

  const hasEmergency = activeGoals.some(g => g.goalKind === OperationalGoalKind.EMERGENCY_FUND);
  const w30 = forecast.windows.find(w => w.windowDays === 30) ?? forecast.windows[forecast.windows.length - 1];
  const threshold = getLowBalanceThresholdUsd();
  if (!hasEmergency && w30 && w30.lowestProjectedBalance < threshold * 2) {
    recs.push({
      attentionKey: 'EMERGENCY_RESERVE_MISSING',
      logicalKind: 'EMERGENCY_RESERVE',
      priority: w30.lowestProjectedBalance < threshold ? 'high' : 'medium',
      title: 'Guidance · No emergency fund goal while cushion is thin',
      body: `Lowest projected balance in 30d is $${w30.lowestProjectedBalance.toFixed(2)} vs cushion threshold $${threshold.toFixed(2)}. Consider an EMERGENCY_FUND operational goal linked to a GOAL_FUND bucket.`,
      clientActions: [
        { type: 'OPEN_CASH_FLOW' },
        { type: 'CREATE_GOAL', template: 'EMERGENCY_FUND' },
        { type: 'OPEN_MONEY_CONTROL', tab: 'buckets' },
      ],
      explain: {
        why: 'No active OperationalGoal with goalKind EMERGENCY_FUND while 30d lowest balance is below 2× STACKZEN_LOW_BALANCE_ALERT_USD.',
        dataInfluences: ['buildCashFlowForecast windows[30d].lowestProjectedBalance', 'getLowBalanceThresholdUsd()', 'OperationalGoal list'],
        calculations: ['Compare lowestProjectedBalance to threshold × 2'],
        expectedImpact: 'A dedicated emergency goal makes pacing and contributions auditable via the same SmartAllocation pipeline.',
        confidence: 0.55,
      },
    });
  }

  const guardCount = await prisma.spendingGuardrailPolicy.count({
    where: { userId, enabled: true },
  });
  if (guardCount > 0 && forecast.risks.some(r => r.code === 'PROJECTED_LOW_BALANCE')) {
    recs.push({
      attentionKey: 'SPENDING_REVIEW_GUARDRAILS',
      logicalKind: 'SPENDING_REDUCTION',
      priority: 'medium',
      title: 'Guidance · Review spending guardrails with low projected balance',
      body: `You have ${guardCount} active spending guardrail(s). With a weak projected cushion, tighten category limits or pause non-essential spend categories tied to those guardrails.`,
      clientActions: [
        { type: 'OPEN_CASH_FLOW' },
        { type: 'OPEN_MONEY_CONTROL', tab: 'review' },
      ],
      explain: {
        why: 'PROJECTED_LOW_BALANCE present and SpendingGuardrailPolicy.enabled count > 0.',
        dataInfluences: ['analyzeRisks PROJECTED_LOW_BALANCE', 'SpendingGuardrailPolicy rows'],
        calculations: ['guardCount = COUNT(*) WHERE userId AND enabled'],
        expectedImpact: 'Lower category ceilings reduce modeled outflows on the next guardrail evaluation cycle.',
        confidence: 0.5,
      },
    });
  }

  const ledgerN = Number(forecast.explain.inputsUsed.ledgerRowsSampled ?? 0);
  if (forecast.recurringIncome.length === 0 && ledgerN >= 20) {
    recs.push({
      attentionKey: 'INCOME_PATTERN_UNSTABLE',
      logicalKind: 'CASH_FLOW_SAFETY',
      priority: 'low',
      title: 'Guidance · Income pattern not detected from ledger',
      body: 'With sufficient transaction history but no detected recurring inflow series, forecast income timing may be understated. Verify paycheck cadence or add RecurringBill / invoice expectations.',
      clientActions: [{ type: 'OPEN_CASH_FLOW' }, { type: 'OPEN_MONEY_CONTROL', tab: 'review' }],
      explain: {
        why: 'recurringIncome.length === 0 while explain.inputsUsed.ledgerRowsSampled ≥ 20.',
        dataInfluences: ['detectRecurringPatterns output embedded in forecast', 'buildExplainPayload inputsUsed'],
        calculations: ['Pattern detection requires ≥3 similar inflows with stable intervals (see cash flow assumptions).'],
        expectedImpact: 'Adding explicit income expectations improves bill-vs-income ordering in the 30d window.',
        confidence: 0.45,
      },
    });
  }

  const now = new Date();
  const horizon = addDays(now, 7);
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: { notIn: ['paid', 'failed'] },
      OR: [{ dueDate: { lt: now } }, { dueDate: { gte: now, lte: horizon } }],
    },
    orderBy: { dueDate: 'asc' },
    take: 20,
    select: { id: true, number: true, amount: true, dueDate: true, jobId: true, clientId: true },
  });

  const overdue = invoices.filter(i => i.dueDate < now);
  if (overdue.length > 0) {
    const total = overdue.reduce((s, i) => s + i.amount, 0);
    const invActions: AutomationClientAction[] = overdue
      .slice(0, 4)
      .map(i => ({ type: 'OPEN_INVOICE' as const, invoiceId: i.id }));
    recs.push({
      attentionKey: 'INVOICE_OVERDUE_BATCH',
      logicalKind: 'INVOICE_FOLLOWUP',
      priority: 'high',
      title: 'Guidance · Overdue invoices need follow-up',
      body: `${overdue.length} unpaid invoice(s) are past due (≈ $${total.toFixed(2)} outstanding). Record payments or follow up to protect liquidity assumptions.`,
      clientActions: [{ type: 'OPEN_CASH_FLOW' }, ...invActions],
      explain: {
        why: 'Invoice rows with status not paid/failed and dueDate < today.',
        dataInfluences: ['Invoice table (user scoped)'],
        calculations: ['Filtered count and sum of invoice.amount for overdue set'],
        expectedImpact: 'Collecting receivables improves actual balance ahead of modeled due-date inflows.',
        confidence: 0.85,
      },
    });
  }

  const dueSoon = invoices.filter(i => i.dueDate >= now && i.dueDate <= horizon);
  if (dueSoon.length >= 3 && overdue.length === 0) {
    const invActions: AutomationClientAction[] = dueSoon
      .slice(0, 4)
      .map(i => ({ type: 'OPEN_INVOICE' as const, invoiceId: i.id }));
    recs.push({
      attentionKey: 'INVOICE_CLUSTER_DUE',
      logicalKind: 'INVOICE_FOLLOWUP',
      priority: 'medium',
      title: 'Guidance · Cluster of invoices due within 7 days',
      body: `${dueSoon.length} invoices are due this week. Align payout timing with projected outflows in Cash Flow.`,
      clientActions: [{ type: 'OPEN_CASH_FLOW' }, ...invActions],
      explain: {
        why: 'Count of unpaid invoices with dueDate in [now, now+7d] ≥ 3 and no overdue in batch.',
        dataInfluences: ['Invoice dueDate and status'],
        calculations: ['dueSoon.length'],
        expectedImpact: 'Proactive client follow-up reduces late-payment drag on forecast confidence.',
        confidence: 0.6,
      },
    });
  }

  const depJobs = await prisma.job.findMany({
    where: { userId, status: JobStatus.DEPOSIT_PENDING },
    take: 5,
    select: { id: true },
  });
  if (depJobs.length > 0) {
    for (let i = 0; i < recs.length; i++) {
      if (recs[i].sourceRiskCode !== 'DEPOSIT_RUNWAY_WARNING') continue;
      recs[i] = {
        ...recs[i],
        clientActions: [
          ...recs[i].clientActions,
          ...depJobs.map(j => ({ type: 'OPEN_JOB' as const, jobId: j.id })),
        ],
      };
    }
  }

  return {
    recommendations: dedupeGuidance(recs),
    forecastSnapshot,
  };
}

function dedupeGuidance(recs: GuidanceRecommendation[]): GuidanceRecommendation[] {
  const byKey = new Map<string, GuidanceRecommendation>();
  for (const r of recs) {
    const existing = byKey.get(r.attentionKey);
    if (!existing || rank(existing.priority) < rank(r.priority)) {
      byKey.set(r.attentionKey, r);
    }
  }
  return [...byKey.values()];
}

function rank(p: GuidancePriorityLevel): number {
  switch (p) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}
