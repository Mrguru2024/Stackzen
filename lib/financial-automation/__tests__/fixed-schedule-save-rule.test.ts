import {
  parseFixedScheduleAmountAction,
  parseFixedScheduleConfig,
  shouldRunFixedScheduleUtc,
} from '@/lib/financial-automation/fixed-schedule-save-rule';

describe('shouldRunFixedScheduleUtc', () => {
  it('runs weekly rule on matching UTC weekday', () => {
    const schedule = { cadence: 'WEEKLY' as const, dayOfWeek: 3 };
    const wed = new Date('2026-05-13T12:00:00.000Z');
    expect(wed.getUTCDay()).toBe(3);
    expect(shouldRunFixedScheduleUtc(wed, schedule)).toBe(true);
    const thu = new Date('2026-05-14T12:00:00.000Z');
    expect(shouldRunFixedScheduleUtc(thu, schedule)).toBe(false);
  });

  it('runs monthly rule on matching UTC calendar day', () => {
    const schedule = { cadence: 'MONTHLY' as const, dayOfMonth: 1 };
    expect(shouldRunFixedScheduleUtc(new Date('2026-06-01T00:00:00.000Z'), schedule)).toBe(true);
    expect(shouldRunFixedScheduleUtc(new Date('2026-06-02T00:00:00.000Z'), schedule)).toBe(false);
  });
});

describe('parseFixedScheduleAmountAction', () => {
  it('parses fixed USD action', () => {
    expect(
      parseFixedScheduleAmountAction([{ bucket: 'auto_save', amountUsd: 25, mode: 'FIXED_AMOUNT_USD' }])
    ).toEqual({
      bucket: 'auto_save',
      amountUsd: 25,
      mode: 'FIXED_AMOUNT_USD',
    });
  });
});

describe('parseFixedScheduleConfig', () => {
  it('accepts valid schedule objects', () => {
    expect(parseFixedScheduleConfig({ cadence: 'WEEKLY', dayOfWeek: 1 })).toEqual({
      cadence: 'WEEKLY',
      dayOfWeek: 1,
    });
  });
});
