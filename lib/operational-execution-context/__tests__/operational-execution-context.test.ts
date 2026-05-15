import {
  appendOperationalHandoffToHref,
  explainOperationalExecutionHandoff,
  parseOperationalHandoffFromSearchParams,
  serializeOperationalHandoffQuery,
} from '@/lib/operational-execution-context';

describe('operational-execution-context', () => {
  it('serializes and parses round-trip', () => {
    const q = serializeOperationalHandoffQuery({
      source: 'command_center',
      subsystem: 'timing',
      band: 'escalating',
      ctaLadderStep: 2,
    });
    const parsed = parseOperationalHandoffFromSearchParams(new URLSearchParams(q));
    expect(parsed).toEqual({
      source: 'command_center',
      subsystem: 'timing',
      band: 'escalating',
      ctaLadderStep: 2,
    });
  });

  it('rejects unknown op_src', () => {
    expect(parseOperationalHandoffFromSearchParams(new URLSearchParams('op_src=unknown'))).toBeNull();
  });

  it('appends handoff preserving hash and merging query', () => {
    const href = appendOperationalHandoffToHref('/operational-center?tab=1#operational-actions', {
      source: 'command_center',
      ctaLadderStep: 1,
    });
    expect(href).toContain('#operational-actions');
    expect(href).toContain('op_src=command_center');
    expect(href).toContain('op_step=1');
    expect(href).toContain('tab=1');
  });

  it('explain returns messages for ladder step 3', () => {
    const ex = explainOperationalExecutionHandoff({
      source: 'command_center',
      ctaLadderStep: 3,
      subsystem: 'reserve',
      band: 'escalating',
    });
    expect(ex?.title).toBe('Operational continuation');
    expect(ex?.bodyLines[0]).toMatch(/reserve and allocation/);
  });
});
