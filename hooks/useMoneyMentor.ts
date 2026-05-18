import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

function newMessageId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatContext {
  financialGoals?: string[];
  riskTolerance?: 'low' | 'medium' | 'high';
  investmentExperience?: 'beginner' | 'intermediate' | 'advanced';
  currentPortfolio?: {
    stocks: number;
    bonds: number;
    cash: number;
    other: number;
  };
}

type AiConsentState = {
  aiConsentAt: string | null;
  aiMemoryEnabled: boolean;
  aiOptOut: boolean;
};

export function useMoneyMentor() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ChatContext>({});
  const [consent, setConsent] = useState<AiConsentState | null>(null);
  const [consentLoading, setConsentLoading] = useState(true);

  const loadConsent = useCallback(async () => {
    if (!session?.user) return;
    setConsentLoading(true);
    try {
      const response = await fetch('/api/ai/consent', { credentials: 'same-origin' });
      if (response.ok) {
        const data = (await response.json()) as AiConsentState & {
          aiConsentAt?: string | Date | null;
        };
        setConsent({
          aiConsentAt: data.aiConsentAt
            ? typeof data.aiConsentAt === 'string'
              ? data.aiConsentAt
              : new Date(data.aiConsentAt).toISOString()
            : null,
          aiMemoryEnabled: data.aiMemoryEnabled ?? false,
          aiOptOut: data.aiOptOut ?? false,
        });
      }
    } catch {
      setConsent(null);
    } finally {
      setConsentLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    void loadConsent();
  }, [loadConsent]);

  useEffect(() => {
    async function fetchChatHistory() {
      if (!session?.user || !consent?.aiConsentAt) return;

      try {
        const response = await fetch('/api/money-mentor/history', { credentials: 'same-origin' });
        if (!response.ok) {
          if (response.status === 403) return;
          throw new Error('Failed to fetch chat history');
        }

        const data = await response.json();
        setMessages(
          (data.messages ?? []).map(
            (m: { id: string; content: string; role: string; timestamp: string }) => ({
              id: m.id,
              content: m.content,
              role: m.role as 'user' | 'assistant',
              timestamp: new Date(m.timestamp),
            })
          )
        );
        setContext(data.context ?? {});
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    }

    void fetchChatHistory();
  }, [session, consent?.aiConsentAt]);

  const grantConsent = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/ai/consent', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('Failed to grant AI consent');
      await loadConsent();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Consent failed');
      return false;
    }
  };

  const sendMessage = async (content: string) => {
    if (!session?.user) return false;
    if (!consent?.aiConsentAt) {
      setError('Please enable StackZen AI in settings before chatting.');
      return false;
    }

    const userMessage: Message = {
      id: newMessageId(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/money-mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ message: content, context }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'AI_CONSENT_REQUIRED') {
          setError('AI consent is required. Enable StackZen AI in Settings → AI.');
          return false;
        }
        if (data.blocked && data.response) {
          const assistantMessage: Message = {
            id: newMessageId(),
            content: data.response,
            role: 'assistant',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          return true;
        }
        throw new Error(data.error ?? 'Failed to get response from Money Mentor');
      }

      const assistantMessage: Message = {
        id: newMessageId(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      if (data.updatedContext) {
        setContext(data.updatedContext);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/ai/memory', {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Failed to clear chat history');
      }

      setMessages([]);
      setContext({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return {
    messages,
    loading,
    error,
    context,
    consent,
    consentLoading,
    needsConsent: !consentLoading && !consent?.aiConsentAt,
    grantConsent,
    sendMessage,
    clearChat,
  };
}
