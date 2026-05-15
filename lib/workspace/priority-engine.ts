import type { NotificationSeverity } from '@prisma/client';
import type { OperationalAlertDto } from '@/lib/operational-notifications/types';

export type WorkspaceRankContext = {
  incomeProfileTypes: string[];
};

function severityScore(s: NotificationSeverity): number {
  switch (s) {
    case 'CRITICAL':
      return 4;
    case 'WARNING':
      return 3;
    case 'INFO':
      return 2;
    default:
      return 1;
  }
}

function domainPreference(domain: OperationalAlertDto['domain']): number {
  if (domain === 'guidance') return 3;
  if (domain === 'goals') return 2;
  return 1;
}

/** Pick the higher-severity alert; tie-break prefers guidance domain (richer structured metadata). */
export function pickAlertWinner(a: OperationalAlertDto, b: OperationalAlertDto): OperationalAlertDto {
  const diff = severityScore(b.severity) - severityScore(a.severity);
  if (diff !== 0) return diff > 0 ? b : a;
  const dp = domainPreference(b.domain) - domainPreference(a.domain);
  if (dp !== 0) return dp > 0 ? b : a;
  return new Date(b.createdAt).getTime() >= new Date(a.createdAt).getTime() ? b : a;
}

/**
 * Drops duplicate alerts that share the same `dedupeKey` (e.g. cashflow + guidance for same risk).
 */
export function dedupeOperationalAlerts(alerts: OperationalAlertDto[]): OperationalAlertDto[] {
  const byKey = new Map<string, OperationalAlertDto[]>();
  for (const a of alerts) {
    if (!a.dedupeKey) continue;
    const arr = byKey.get(a.dedupeKey) ?? [];
    arr.push(a);
    byKey.set(a.dedupeKey, arr);
  }

  const drop = new Set<string>();
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    let winner = group[0];
    for (let i = 1; i < group.length; i++) {
      winner = pickAlertWinner(winner, group[i]);
    }
    for (const a of group) {
      if (a.id !== winner.id) drop.add(a.id);
    }
  }

  return alerts.filter(a => !drop.has(a.id));
}

function profileBoosts(types: string[]) {
  const s = new Set(types.map(t => t.toUpperCase()));
  return {
    boostInvoice: s.has('CONTRACTOR') || s.has('FREELANCE') || s.has('BUSINESS'),
    boostWork: s.has('CONTRACTOR') || s.has('FREELANCE') || s.has('BUSINESS') || s.has('GIG'),
    boostGoals: s.has('PAYCHECK') || s.has('SIDE_HUSTLE') || s.has('PASSIVE'),
  };
}

/**
 * Deterministic ranking for the unified workspace (higher score = more urgent).
 */
export function rankOperationalAlerts(
  alerts: OperationalAlertDto[],
  ctx: WorkspaceRankContext
): OperationalAlertDto[] {
  const { boostInvoice, boostWork, boostGoals } = profileBoosts(ctx.incomeProfileTypes);

  const score = (a: OperationalAlertDto): number => {
    let sc = 0;
    if (a.inAttentionQueue) sc += 1000;
    sc += severityScore(a.severity) * 25;
    if (a.uiPriority === 'critical') sc += 80;
    else if (a.uiPriority === 'warning') sc += 40;
    if (boostInvoice && (a.domain === 'invoice' || a.domain === 'billing')) sc += 45;
    if (boostWork && a.domain === 'work') sc += 45;
    if (boostGoals && a.domain === 'goals') sc += 30;
    if (a.domain === 'guidance') sc += 20;
    if (a.domain === 'financial') sc += 10;
    return sc;
  };

  return [...alerts].sort((a, b) => {
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
