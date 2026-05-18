import { analyzePhrase } from '@/lib/ai/policies/phrase-catcher';

describe('analyzePhrase', () => {
  it('detects crisis intents without LLM', () => {
    const result = analyzePhrase('I want to end my life');
    expect(result.intent).toBe('crisis_distress');
    expect(result.crisisResponse).toBeTruthy();
  });

  it('flags affordability questions', () => {
    const result = analyzePhrase('Can I afford to buy a new truck?');
    expect(result.intent).toBe('affordability');
    expect(result.block?.code).toBe('AFFORDABILITY_REFRAME');
  });

  it('routes help requests to emotional support', () => {
    const result = analyzePhrase("I'm struggling with money");
    expect(result.intent).toBe('help_general');
    expect(result.suggestedTask).toBe('emotional_support');
  });
});
