import { SubscriptionLevel } from '@prisma/client';
import {
  availableRuleTemplates,
  buildRuleFromTemplate,
  getRuleTemplate,
  isAllocationPercentSumValid,
  listRuleTemplates,
  normalizeBucketSlug,
} from '../rule-templates';

describe('rule-templates', () => {
  it('lists every template descriptor', () => {
    const all = listRuleTemplates();
    expect(all.map(t => t.id)).toEqual(
      expect.arrayContaining([
        'BUDGET_SPLIT_50_30_20',
        'BUDGET_SPLIT_40_30_30',
        'BUDGET_SPLIT_CUSTOM',
        'PAYCHECK_SAVINGS_BOOST',
        'SPEND_ROUND_UP_SAVINGS',
        'SCHEDULED_FIXED_SAVE_USD',
        'CATEGORY_SPEND_TAX',
        'TAX_RESERVE_ON_SELF_EMPLOYED',
        'CATEGORY_GUARDRAIL',
      ])
    );
  });

  it('marks Pro templates as locked for free tier', () => {
    const free = availableRuleTemplates(SubscriptionLevel.FREE);
    const pro = availableRuleTemplates(SubscriptionLevel.PRO);
    const customFree = free.find(t => t.id === 'BUDGET_SPLIT_CUSTOM');
    const customPro = pro.find(t => t.id === 'BUDGET_SPLIT_CUSTOM');
    expect(customFree?.locked).toBe(true);
    expect(customPro?.locked).toBe(false);
  });

  it('locks 40 / 30 / 30 preset for free tier (only 50 / 30 / 20 is the basic free preset)', () => {
    const free = availableRuleTemplates(SubscriptionLevel.FREE);
    const splitBasic = free.find(t => t.id === 'BUDGET_SPLIT_50_30_20');
    const split403030 = free.find(t => t.id === 'BUDGET_SPLIT_40_30_30');
    expect(splitBasic?.locked).toBe(false);
    expect(split403030?.locked).toBe(true);
  });

  it('rejects building the 40 / 30 / 30 template for free tier', () => {
    expect(() =>
      buildRuleFromTemplate(
        'BUDGET_SPLIT_40_30_30',
        {},
        { subscriptionLevel: SubscriptionLevel.FREE }
      )
    ).toThrow(/Pro subscription/);
  });

  it('builds 40 / 30 / 30 actions for Pro accounts', () => {
    const built = buildRuleFromTemplate(
      'BUDGET_SPLIT_40_30_30',
      {},
      { subscriptionLevel: SubscriptionLevel.PRO }
    );
    expect(built.rulePayload.actions).toEqual([
      { bucket: 'needs', percent: 40 },
      { bucket: 'wants', percent: 30 },
      { bucket: 'savings', percent: 30 },
    ]);
  });

  it('builds a free preset rule without Pro and with the allocationPreset flag', () => {
    const built = buildRuleFromTemplate(
      'BUDGET_SPLIT_50_30_20',
      {},
      { subscriptionLevel: SubscriptionLevel.FREE }
    );
    expect(built.rulePayload.type).toBe('ALLOCATION');
    expect(built.rulePayload.triggerType).toBe('TRANSACTION_POSTED');
    expect(built.rulePayload.allocationPreset).toBe('FIFTY_THIRTY_TWENTY');
    expect(built.rulePayload.conditions).toMatchObject({
      directions: ['INFLOW'],
      excludeTransfers: true,
    });
  });

  it('rejects custom split for non-Pro subscriptions', () => {
    expect(() =>
      buildRuleFromTemplate(
        'BUDGET_SPLIT_CUSTOM',
        { allocationsCustom: [{ bucket: 'needs', percent: 100 }] },
        { subscriptionLevel: SubscriptionLevel.FREE }
      )
    ).toThrow(/Pro subscription/);
  });

  it('builds a Pro custom split when percents total 100', () => {
    const built = buildRuleFromTemplate(
      'BUDGET_SPLIT_CUSTOM',
      {
        allocationsCustom: [
          { bucket: 'Needs', percent: 45 },
          { bucket: 'wants', percent: 25 },
          { bucket: 'savings', percent: 20 },
          { bucket: 'taxes', percent: 10 },
        ],
      },
      { subscriptionLevel: SubscriptionLevel.PRO }
    );
    expect(built.rulePayload.actions).toEqual([
      { bucket: 'needs', percent: 45 },
      { bucket: 'wants', percent: 25 },
      { bucket: 'savings', percent: 20 },
      { bucket: 'taxes', percent: 10 },
    ]);
  });

  it('rejects custom split when percents do not total 100', () => {
    expect(() =>
      buildRuleFromTemplate(
        'BUDGET_SPLIT_CUSTOM',
        {
          allocationsCustom: [
            { bucket: 'needs', percent: 60 },
            { bucket: 'wants', percent: 30 },
          ],
        },
        { subscriptionLevel: SubscriptionLevel.PRO }
      )
    ).toThrow(/100%/);
  });

  it('builds a paycheck savings boost with paycheck-only conditions', () => {
    const built = buildRuleFromTemplate(
      'PAYCHECK_SAVINGS_BOOST',
      { savingsBucket: 'Emergency', savingsPercent: 15 },
      { subscriptionLevel: SubscriptionLevel.PRO }
    );
    expect(built.rulePayload.type).toBe('ALLOCATION');
    expect(built.rulePayload.conditions).toMatchObject({
      operationalClasses: ['PAYCHECK'],
    });
    const actions = built.rulePayload.actions ?? [];
    expect(actions[0]).toEqual({ bucket: 'emergency', percent: 15 });
  });

  it('builds a spend round-up rule with outflow conditions', () => {
    const built = buildRuleFromTemplate(
      'SPEND_ROUND_UP_SAVINGS',
      { roundUpBucket: 'Vacation Fund', roundUpIncrement: 2 },
      { subscriptionLevel: SubscriptionLevel.FREE }
    );
    expect(built.rulePayload.type).toBe('ALLOCATION');
    expect(built.rulePayload.conditions).toMatchObject({
      allocationMode: 'SPEND_ROUND_UP',
      directions: ['OUTFLOW'],
      excludeTransfers: true,
    });
    expect(built.rulePayload.actions?.[0]).toEqual({
      bucket: 'vacation_fund',
      increment: 2,
      mode: 'ROUND_UP',
    });
  });

  it('builds a scheduled fixed save rule with SCHEDULED trigger', () => {
    const built = buildRuleFromTemplate(
      'SCHEDULED_FIXED_SAVE_USD',
      {
        scheduleCadence: 'WEEKLY',
        scheduleDayOfWeek: 3,
        scheduleBucket: 'Auto Save',
        scheduleAmountUsd: 20,
      },
      { subscriptionLevel: SubscriptionLevel.PRO }
    );
    expect(built.rulePayload.triggerType).toBe('SCHEDULED');
    expect(built.rulePayload.schedule).toEqual({ cadence: 'WEEKLY', dayOfWeek: 3 });
    expect(built.rulePayload.actions?.[0]).toMatchObject({
      bucket: 'auto_save',
      amountUsd: 20,
      mode: 'FIXED_AMOUNT_USD',
    });
  });

  it('builds a category spend tax rule with category filter', () => {
    const built = buildRuleFromTemplate(
      'CATEGORY_SPEND_TAX',
      {
        taxCategory: 'food',
        taxDestinationBucket: 'treat_tax',
        taxSpendPercent: 8,
        taxMaxAmountUsd: 5,
      },
      { subscriptionLevel: SubscriptionLevel.FREE }
    );
    expect(built.rulePayload.triggerType).toBe('TRANSACTION_POSTED');
    expect(built.rulePayload.conditions).toMatchObject({
      categoryNames: ['FOOD'],
      directions: ['OUTFLOW'],
    });
    expect(built.rulePayload.actions?.[0]).toMatchObject({
      bucket: 'treat_tax',
      spendPercent: 8,
      mode: 'SPEND_PERCENT',
      maxAmountUsd: 5,
    });
  });

  it('builds a self-employed tax reserve with gig/contractor conditions', () => {
    const built = buildRuleFromTemplate(
      'TAX_RESERVE_ON_SELF_EMPLOYED',
      { reserveBucket: 'TAXES', reservePercent: 30 },
      { subscriptionLevel: SubscriptionLevel.PRO }
    );
    expect(built.rulePayload.conditions).toMatchObject({
      operationalClasses: ['GIG_PAYMENT', 'CONTRACTOR_PAYMENT'],
    });
    expect((built.rulePayload.actions ?? [])[0]).toEqual({ bucket: 'taxes', percent: 30 });
  });

  it('builds a guardrail template with a companion policy', () => {
    const built = buildRuleFromTemplate(
      'CATEGORY_GUARDRAIL',
      { guardrailCategory: 'FOOD', guardrailLimit: 600, guardrailWarnAt: 80 },
      { subscriptionLevel: SubscriptionLevel.FREE }
    );
    expect(built.rulePayload.type).toBe('GUARDRAIL');
    expect(built.guardrailPolicy).toEqual({
      categoryName: 'FOOD',
      limitAmount: 600,
      warnAtPercent: 80,
    });
  });

  it('normalizes bucket slugs', () => {
    expect(normalizeBucketSlug('  Needs Buffer ')).toBe('needs_buffer');
    expect(normalizeBucketSlug('TAXES')).toBe('taxes');
  });

  it('validates allocation sums (with a 0.05 tolerance)', () => {
    expect(isAllocationPercentSumValid([{ bucket: 'a', percent: 100 }])).toBe(true);
    expect(
      isAllocationPercentSumValid([
        { bucket: 'a', percent: 33.33 },
        { bucket: 'b', percent: 33.33 },
        { bucket: 'c', percent: 33.34 },
      ])
    ).toBe(true);
    expect(
      isAllocationPercentSumValid([
        { bucket: 'a', percent: 50 },
        { bucket: 'b', percent: 30 },
      ])
    ).toBe(false);
  });

  it('returns null for unknown template lookups', () => {
    // @ts-expect-error testing unknown id at runtime
    expect(getRuleTemplate('NOPE')).toBeNull();
  });
});
