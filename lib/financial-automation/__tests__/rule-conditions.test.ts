import { conditionsAllowRule } from '@/lib/financial-automation/rule-conditions';

describe('conditionsAllowRule categoryNames', () => {
  it('matches transaction category case-insensitively', () => {
    expect(
      conditionsAllowRule({
        conditions: { categoryNames: ['FOOD'], directions: ['OUTFLOW'] },
        direction: 'OUTFLOW',
        amount: -10,
        operationalClass: 'EXPENSE',
        isTransferHint: false,
        categoryName: 'food',
      })
    ).toBe(true);
  });

  it('rejects when category does not match', () => {
    expect(
      conditionsAllowRule({
        conditions: { categoryNames: ['FOOD'] },
        direction: 'OUTFLOW',
        amount: -10,
        operationalClass: 'EXPENSE',
        isTransferHint: false,
        categoryName: 'TRAVEL',
      })
    ).toBe(false);
  });
});
