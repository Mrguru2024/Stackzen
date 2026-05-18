/**
 * Browser-safe client for StackZen AI orchestration (no API keys).
 */

export type ClientAiGenerateBody = {
  message: string;
  task?:
    | 'orchestration'
    | 'financial_guidance'
    | 'emotional_support'
    | 'document_analysis'
    | 'summarization'
    | 'structured_output';
  context?: Record<string, unknown>;
  turnstileToken?: string;
};

export type ClientAiGenerateResponse = {
  response: string;
  provider?: string;
  model?: string;
  policyApplied?: boolean;
  fallbackUsed?: boolean;
  blocked?: boolean;
  code?: string;
};

export async function requestAiGenerate(
  body: ClientAiGenerateBody
): Promise<ClientAiGenerateResponse> {
  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as ClientAiGenerateResponse & { error?: string };

  if (!res.ok) {
    if (data.blocked && data.response) {
      return data;
    }
    throw new Error(data.error ?? data.response ?? `AI request failed (${res.status})`);
  }

  return data;
}
