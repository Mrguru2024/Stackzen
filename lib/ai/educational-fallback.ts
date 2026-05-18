import 'server-only';

import type { AIRequest, AIResponse } from '@/lib/ai/types';

export interface EducationalContext {
  investmentExperience?: 'beginner' | 'intermediate' | 'advanced';
  riskTolerance?: 'low' | 'medium' | 'high';
  incomeProfileTags?: string[];
}

export function generateEducationalResponse(
  message: string,
  context: EducationalContext = {}
): string {
  const lowerMessage = message.toLowerCase();
  const experience = context.investmentExperience || 'beginner';
  const riskTolerance = context.riskTolerance || 'medium';

  if (lowerMessage.includes('investment') || lowerMessage.includes('invest')) {
    return (
      `Based on a ${experience} experience level and ${riskTolerance} risk tolerance, one option to consider is exploring general concepts such as diversification, asset classes, and time horizon.\n\n` +
      'You may want to compare approaches with a licensed financial professional before making decisions.'
    );
  }

  if (lowerMessage.includes('budget') || lowerMessage.includes('saving')) {
    return (
      'Some people find it helpful to track spending, automate savings, and use a simple framework like 50/30/20 as a starting point.\n\n' +
      'Would you like to explore any of these ideas in more detail?'
    );
  }

  if (lowerMessage.includes('debt') || lowerMessage.includes('loan')) {
    return (
      'General approaches often discussed include prioritizing high-interest balances, comparing consolidation options, and building a repayment plan.\n\n' +
      'A human mentor on StackZen can help you think through trade-offs for your situation.'
    );
  }

  if (context.incomeProfileTags?.length) {
    return (
      `I can share general financial education tailored to ${context.incomeProfileTags.join(', ')} work patterns. ` +
      'What would you like to explore — budgeting, saving, debt, or investing basics?'
    );
  }

  return 'I can share general financial education. What topic would you like to explore — budgeting, saving, debt, or investing basics?';
}

export function buildEducationalFallbackResponse(
  input: AIRequest,
  text: string,
  latencyMs: number,
  fallbackUsed: boolean
): AIResponse {
  return {
    text,
    provider: 'educational',
    model: 'rule-based-v1',
    policyApplied: false,
    blocked: false,
    latencyMs,
    fallbackUsed,
    metadata: { task: input.task, intent: input.intent },
  };
}
