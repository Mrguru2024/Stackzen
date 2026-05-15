import type { CashFlowForecastResponseDto } from '@/lib/cashflow/types';
import type { OperationalActionProposalCore } from '@/lib/operational-actions/types';
import {
  fingerprintForExtendGoal,
  fingerprintForGoalContribution,
  fingerprintForPauseRule,
  fingerprintForPrepareReserve,
  fingerprintForShiftBill,
} from '@/lib/operational-actions/fingerprint';

export function computeLiveFingerprint(
  forecast: CashFlowForecastResponseDto,
  proposal: OperationalActionProposalCore
): string {
  const riskCodes = forecast.risks.map(r => r.code);
  switch (proposal.kind) {
    case 'PAUSE_AUTOMATION_RULE': {
      const p = proposal.payload as { ruleId: string };
      return fingerprintForPauseRule({
        forecastGeneratedAt: forecast.generatedAt,
        riskCodes,
        ruleId: p.ruleId,
      });
    }
    case 'RECORD_GOAL_CONTRIBUTION': {
      const p = proposal.payload as { goalId: string; suggestedAmount: number };
      return fingerprintForGoalContribution({
        forecastGeneratedAt: forecast.generatedAt,
        goalId: p.goalId,
        suggestedAmount: p.suggestedAmount.toFixed(2),
      });
    }
    case 'EXTEND_GOAL_TARGET_DATE': {
      const p = proposal.payload as { goalId: string; proposedTargetDate: string };
      return fingerprintForExtendGoal({
        forecastGeneratedAt: forecast.generatedAt,
        goalId: p.goalId,
        proposedTargetDate: p.proposedTargetDate,
      });
    }
    case 'SHIFT_RECURRING_BILL_DATE': {
      const p = proposal.payload as { billId: string; proposedDate: string };
      return fingerprintForShiftBill({
        forecastGeneratedAt: forecast.generatedAt,
        billId: p.billId,
        proposedDate: p.proposedDate,
      });
    }
    case 'PREPARE_RESERVE_FOR_OBLIGATION': {
      const p = proposal.payload as { goalId: string; clusterId: string; targetAmount: number };
      return fingerprintForPrepareReserve({
        forecastGeneratedAt: forecast.generatedAt,
        goalId: p.goalId,
        clusterId: p.clusterId,
        targetAmount: p.targetAmount.toFixed(2),
      });
    }
    default:
      return '';
  }
}
