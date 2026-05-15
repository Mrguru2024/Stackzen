import {
  classifyOperationalTransaction,
  mapPlaidDetailedToBudgetSlug,
  normalizeBudgetCategorySlug,
} from './classification';

describe('classification', () => {
  it('classifies paycheck inflows', () => {
    const r = classifyOperationalTransaction({
      direction: 'INFLOW',
      description: 'Employer Payroll',
      plaidPersonalFinanceDetailed: null,
    });
    expect(r.operationalClass).toBe('PAYCHECK');
  });

  it('classifies gig deposits', () => {
    const r = classifyOperationalTransaction({
      direction: 'INFLOW',
      description: 'Uber BV',
      plaidPersonalFinanceDetailed: null,
    });
    expect(r.operationalClass).toBe('GIG_PAYMENT');
  });

  it('maps Plaid PFC to budget slug', () => {
    expect(mapPlaidDetailedToBudgetSlug('FOOD_AND_DRINK_GROCERIES')).toBe('FOOD');
    expect(mapPlaidDetailedToBudgetSlug(undefined)).toBe('OTHER');
  });

  it('normalizes budget slugs case-insensitively', () => {
    expect(normalizeBudgetCategorySlug('food')).toBe('FOOD');
    expect(normalizeBudgetCategorySlug('UTILITIES')).toBe('UTILITIES');
    expect(normalizeBudgetCategorySlug('not-a-real-slug')).toBe('OTHER');
  });

  it('marks subscription-like outflows', () => {
    const r = classifyOperationalTransaction({
      direction: 'OUTFLOW',
      description: 'Netflix.com',
      plaidPersonalFinanceDetailed: 'SUBSCRIPTION_VIDEO_STREAMING',
    });
    expect(r.operationalClass).toBe('SUBSCRIPTION');
  });
});
