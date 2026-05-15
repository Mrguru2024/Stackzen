import { parseCategorySpendTaxAction } from '@/lib/financial-automation/category-spend-tax-rule';

describe('parseCategorySpendTaxAction', () => {
  it('parses percent with optional cap', () => {
    expect(
      parseCategorySpendTaxAction([
        { bucket: 'guilt', spendPercent: 12, mode: 'SPEND_PERCENT', maxAmountUsd: 8 },
      ])
    ).toEqual({
      bucket: 'guilt',
      spendPercent: 12,
      mode: 'SPEND_PERCENT',
      maxAmountUsd: 8,
    });
  });

  it('parses percent without cap', () => {
    expect(
      parseCategorySpendTaxAction([{ bucket: 'guilt', spendPercent: 5, mode: 'SPEND_PERCENT' }])
    ).toEqual({
      bucket: 'guilt',
      spendPercent: 5,
      mode: 'SPEND_PERCENT',
      maxAmountUsd: undefined,
    });
  });
});
