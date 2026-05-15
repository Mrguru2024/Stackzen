import {
  computeSpendRoundUpAmount,
  isSpendRoundUpConditions,
  parseSpendRoundUpAction,
} from '@/lib/financial-automation/spend-round-up-rule';

describe('computeSpendRoundUpAmount', () => {
  it('computes spare change to next whole dollar', () => {
    expect(computeSpendRoundUpAmount(3.45, 1)).toBeCloseTo(0.55, 5);
    expect(computeSpendRoundUpAmount(10.01, 1)).toBeCloseTo(0.99, 5);
  });

  it('returns 0 when already on increment boundary', () => {
    expect(computeSpendRoundUpAmount(5, 1)).toBe(0);
    expect(computeSpendRoundUpAmount(10, 2)).toBe(0);
  });

  it('supports multi-dollar increments', () => {
    expect(computeSpendRoundUpAmount(3.45, 2)).toBeCloseTo(0.55, 5);
    expect(computeSpendRoundUpAmount(1.03, 0.5)).toBeCloseTo(0.47, 5);
  });
});

describe('parseSpendRoundUpAction', () => {
  it('parses a valid action row', () => {
    expect(parseSpendRoundUpAction([{ bucket: 'round_up', increment: 1, mode: 'ROUND_UP' }])).toEqual({
      bucket: 'round_up',
      increment: 1,
      mode: 'ROUND_UP',
    });
  });

  it('returns null for invalid payloads', () => {
    expect(parseSpendRoundUpAction([])).toBeNull();
    expect(parseSpendRoundUpAction([{ bucket: 'x', percent: 50 }])).toBeNull();
  });
});

describe('isSpendRoundUpConditions', () => {
  it('detects spend round-up mode', () => {
    expect(isSpendRoundUpConditions({ allocationMode: 'SPEND_ROUND_UP', directions: ['OUTFLOW'] })).toBe(true);
    expect(isSpendRoundUpConditions({ directions: ['OUTFLOW'] })).toBe(false);
  });
});
