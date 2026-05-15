import {
  riskCodeToGuidanceKind,
  riskSeverityToGuidancePriority,
} from '@/lib/guidance/engine';

describe('guidance mappers', () => {
  it('maps risk codes to logical guidance kinds', () => {
    expect(riskCodeToGuidanceKind('PROJECTED_LOW_BALANCE')).toBe('CASH_FLOW_SAFETY');
    expect(riskCodeToGuidanceKind('BILL_CLUSTER')).toBe('BILL_TIMING');
    expect(riskCodeToGuidanceKind('ALLOCATION_PRESSURE')).toBe('ALLOCATION_ADJUSTMENT');
    expect(riskCodeToGuidanceKind('INVOICE_RECEIVABLE_GAP')).toBe('INVOICE_FOLLOWUP');
    expect(riskCodeToGuidanceKind('DEPOSIT_RUNWAY_WARNING')).toBe('CONTRACTOR_RESERVE');
  });

  it('maps severities to guidance priority bands', () => {
    expect(riskSeverityToGuidancePriority('critical')).toBe('critical');
    expect(riskSeverityToGuidancePriority('warning')).toBe('high');
    expect(riskSeverityToGuidancePriority('info')).toBe('medium');
  });
});
