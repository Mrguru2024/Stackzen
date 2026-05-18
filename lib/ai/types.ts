export type AIProviderId = 'openai' | 'claude' | 'gemini' | 'educational';

export type AITaskType =
  | 'orchestration'
  | 'financial_guidance'
  | 'emotional_support'
  | 'document_analysis'
  | 'summarization'
  | 'structured_output';

export type AITone = 'calm' | 'coach' | 'direct';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  task: AITaskType;
  messages: AIMessage[];
  userId: string;
  sessionId?: string;
  tone?: AITone;
  intent?: string;
  context?: {
    incomeProfileTags?: string[];
    financialSnapshot?: Record<string, unknown>;
    documentRefs?: string[];
  };
  options?: {
    maxTokens?: number;
    temperature?: number;
    preferredProvider?: AIProviderId;
    allowFallback?: boolean;
  };
}

export interface AIResponse {
  text: string;
  provider: AIProviderId;
  model: string;
  policyApplied: boolean;
  blocked: boolean;
  blockCode?: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  latencyMs: number;
  fallbackUsed: boolean;
  metadata?: Record<string, unknown>;
}

export interface AIProvider {
  readonly id: Exclude<AIProviderId, 'educational'>;
  isConfigured(): boolean;
  generate(input: AIRequest): Promise<AIResponse>;
}

export interface PhraseCatcherResult {
  intent: string;
  confidence: number;
  block?: { code: string; message: string };
  suggestedTask?: AITaskType;
  crisisResponse?: string;
}
