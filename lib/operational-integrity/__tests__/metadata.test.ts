import { mergeNotificationMetadata, readAttentionKindFromMetadata } from '@/lib/operational-integrity/metadata';

describe('operational integrity metadata helpers', () => {
  it('reads attentionKind from notification metadata', () => {
    expect(readAttentionKindFromMetadata({ attentionKind: 'guidance_X' })).toBe('guidance_X');
    expect(readAttentionKindFromMetadata(null)).toBeNull();
    expect(readAttentionKindFromMetadata({})).toBeNull();
  });

  it('merges metadata objects shallowly', () => {
    const merged = mergeNotificationMetadata({ a: 1, attentionKind: 'k' }, { b: 2 });
    expect(merged).toEqual({ a: 1, attentionKind: 'k', b: 2 });
  });
});
