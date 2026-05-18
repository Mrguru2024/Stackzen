import 'server-only';

import type { AITaskType, AITone, AIMessage } from '@/lib/ai/types';
import { STACKZEN_COMPLIANCE_PROMPT } from '@/lib/ai/prompts/compliance';
import { getToneModifier } from '@/lib/ai/prompts/tone-modifiers';

const TASK_PROMPTS: Record<AITaskType, string> = {
  orchestration:
    'Help plan next steps for the user\'s financial workflow in StackZen (budgeting, invoices, cash flow). Output clear, structured suggestions.',
  financial_guidance:
    'Provide general financial education about budgeting, saving, debt, and investing basics. Relate to gig/contractor income volatility when relevant.',
  emotional_support:
    'Offer empathetic, non-clinical support around money stress. Normalize challenges without minimizing. Suggest practical educational resources.',
  document_analysis:
    'Summarize uploaded financial documents at a high level. Highlight categories and patterns without giving personalized advice.',
  summarization: 'Summarize the provided financial information clearly for a busy professional.',
  structured_output:
    'Respond in clear structured format when asked. Use JSON only when explicitly requested in the user message.',
};

export function buildSystemPrompt(task: AITaskType, tone?: AITone): string {
  const parts = [STACKZEN_COMPLIANCE_PROMPT, TASK_PROMPTS[task]];
  if (tone) {
    parts.push(getToneModifier(tone));
  }
  return parts.join('\n\n');
}

export function assembleMessages(
  task: AITaskType,
  userMessages: AIMessage[],
  tone?: AITone
): AIMessage[] {
  const system = buildSystemPrompt(task, tone);
  const nonSystem = userMessages.filter(m => m.role !== 'system');
  return [{ role: 'system', content: system }, ...nonSystem];
}
