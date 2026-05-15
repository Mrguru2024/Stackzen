import { createHash } from 'node:crypto';

export function buildOperationalActionFingerprint(parts: string[]): string {
  return createHash('sha256').update(parts.join('|'), 'utf8').digest('hex').slice(0, 24);
}

export function fingerprintForPauseRule(input: {
  forecastGeneratedAt: string;
  riskCodes: string[];
  ruleId: string;
}): string {
  const codes = [...input.riskCodes].sort().join(',');
  return buildOperationalActionFingerprint([
    input.forecastGeneratedAt,
    'PAUSE_AUTOMATION_RULE',
    codes,
    input.ruleId,
  ]);
}

export function fingerprintForGoalContribution(input: {
  forecastGeneratedAt: string;
  goalId: string;
  suggestedAmount: string;
}): string {
  return buildOperationalActionFingerprint([
    input.forecastGeneratedAt,
    'RECORD_GOAL_CONTRIBUTION',
    input.goalId,
    input.suggestedAmount,
  ]);
}

export function fingerprintForExtendGoal(input: {
  forecastGeneratedAt: string;
  goalId: string;
  proposedTargetDate: string;
}): string {
  return buildOperationalActionFingerprint([
    input.forecastGeneratedAt,
    'EXTEND_GOAL_TARGET_DATE',
    input.goalId,
    input.proposedTargetDate,
  ]);
}

export function fingerprintForShiftBill(input: {
  forecastGeneratedAt: string;
  billId: string;
  proposedDate: string;
}): string {
  return buildOperationalActionFingerprint([
    input.forecastGeneratedAt,
    'SHIFT_RECURRING_BILL_DATE',
    input.billId,
    input.proposedDate.slice(0, 10),
  ]);
}

export function fingerprintForPrepareReserve(input: {
  forecastGeneratedAt: string;
  goalId: string;
  clusterId: string;
  targetAmount: string;
}): string {
  return buildOperationalActionFingerprint([
    input.forecastGeneratedAt,
    'PREPARE_RESERVE_FOR_OBLIGATION',
    input.goalId,
    input.clusterId,
    input.targetAmount,
  ]);
}
