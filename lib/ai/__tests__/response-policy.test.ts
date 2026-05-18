import { applyResponsePolicy, softenDirectivePhrases } from '@/lib/ai/response-policy';

describe('response-policy', () => {
  it('softens directive phrasing', () => {
    expect(softenDirectivePhrases('You should invest more')).toContain('You may want to');
  });

  it('replaces blocked guarantee language', () => {
    const result = applyResponsePolicy('You should invest in this stock for guaranteed returns');
    expect(result.policyApplied).toBe(true);
    expect(result.text).toContain('licensed financial professional');
  });

  it('passes compliant educational text', () => {
    const text = 'One option to consider is comparing index funds with a professional.';
    const result = applyResponsePolicy(text);
    expect(result.policyApplied).toBe(false);
    expect(result.text).toBe(text);
  });
});
