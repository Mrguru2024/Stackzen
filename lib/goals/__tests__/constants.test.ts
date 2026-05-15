import { goalAllocationSource, parseGoalIdFromAllocationSource } from '@/lib/goals/constants';

describe('goal allocation source', () => {
  it('builds stable source token', () => {
    expect(goalAllocationSource('abc')).toBe('OPERATIONAL_GOAL:abc');
  });

  it('parses goal id from source', () => {
    expect(parseGoalIdFromAllocationSource('OPERATIONAL_GOAL:abc')).toBe('abc');
    expect(parseGoalIdFromAllocationSource('OTHER')).toBeNull();
  });
});
