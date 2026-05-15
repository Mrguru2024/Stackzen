import { mergeOperationalCheckpoint } from '@/lib/operational-state/checkpoint-payload';

describe('mergeOperationalCheckpoint activation', () => {
  it('merges dismissedNbaKeys uniquely', () => {
    const merged = mergeOperationalCheckpoint(
      { version: 1, activation: { dismissedNbaKeys: ['a'] } },
      { activation: { dismissedNbaKeys: ['b', 'a'] } }
    );
    expect(merged.activation?.dismissedNbaKeys?.sort()).toEqual(['a', 'b']);
  });

  it('merges milestoneEventsEmitted uniquely', () => {
    const merged = mergeOperationalCheckpoint(
      { version: 1, activation: { milestoneEventsEmitted: ['income_profile_selected'] } },
      { activation: { milestoneEventsEmitted: ['bank_linked', 'income_profile_selected'] } }
    );
    expect(merged.activation?.milestoneEventsEmitted?.sort()).toEqual([
      'bank_linked',
      'income_profile_selected',
    ]);
  });
});
