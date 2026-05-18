import 'server-only';

import { applyResponsePolicy, softenDirectivePhrases } from '@/lib/ai/response-policy';
import type { AIResponse } from '@/lib/ai/types';

/**
 * Post-generation safety pass — always run before returning to clients.
 */
export function moderateAssistantOutput(text: string, base: AIResponse): AIResponse {
  const softened = softenDirectivePhrases(text);
  const policy = applyResponsePolicy(softened);

  return {
    ...base,
    text: policy.text,
    policyApplied: policy.policyApplied || base.policyApplied,
    metadata: {
      ...base.metadata,
      policyViolations: policy.violations,
    },
  };
}
