import {
  BankConnectionStatus,
  FinancialEventType,
  IncomeProfileType,
  OperationalGoalStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { DerivedActivationSteps } from '@/lib/operational-activation/types';

export async function computeDerivedActivationSteps(userId: string): Promise<DerivedActivationSteps> {
  const [
    profileCount,
    bankCount,
    txCount,
    categorizedAgg,
    ruleCount,
    allocCount,
    goalCount,
    cashflowEvents,
    readNotif,
  ] = await Promise.all([
    prisma.userIncomeProfile.count({ where: { userId, isActive: true } }),
    prisma.bankConnection.count({ where: { userId, status: BankConnectionStatus.ACTIVE } }),
    prisma.financialTransaction.count({ where: { userId } }),
    prisma.financialTransaction.count({ where: { userId, categoryId: { not: null } } }),
    prisma.automationRule.count({ where: { userId, enabled: true } }),
    prisma.smartAllocation.count({ where: { userId } }),
    prisma.operationalGoal.count({
      where: { userId, status: { in: [OperationalGoalStatus.ACTIVE, OperationalGoalStatus.COMPLETED] } },
    }),
    prisma.financialEvent.count({
      where: {
        userId,
        type: { in: [FinancialEventType.CASHFLOW_FORECAST_GENERATED, FinancialEventType.CASHFLOW_RISK_DETECTED] },
      },
    }),
    prisma.automationNotification.count({ where: { userId, readAt: { not: null } } }),
  ]);

  const income_profile_selected = profileCount > 0;
  const bank_linked = bankCount > 0;
  const ledger_populated = txCount > 0;
  const transactions_categorized = categorizedAgg >= 3;
  const envelopes_or_automation = ruleCount > 0 || allocCount > 0;
  const forecast_engaged = cashflowEvents > 0;
  const operational_goal_created = goalCount > 0;
  const attention_queue_engaged = readNotif > 0;

  return {
    income_profile_selected,
    bank_linked,
    ledger_populated,
    transactions_categorized,
    envelopes_or_automation,
    forecast_engaged,
    operational_goal_created,
    attention_queue_engaged,
    evidence: {
      transactionCount: txCount,
      categorizedCount: categorizedAgg,
      activeIncomeProfileCount: profileCount,
      activeBankConnectionCount: bankCount,
      enabledAutomationRuleCount: ruleCount,
      smartAllocationCount: allocCount,
      operationalGoalCount: goalCount,
      cashflowFinancialEventCount: cashflowEvents,
      readNotificationCount: readNotif,
    },
  };
}

export async function loadActiveIncomeProfileTypes(userId: string): Promise<IncomeProfileType[]> {
  const rows = await prisma.userIncomeProfile.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { type: true },
  });
  return rows.map(r => r.type);
}
