import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

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

export function useMoneyMentor() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ChatContext>({});

  useEffect(() => {
    async function fetchChatHistory() {
      if (!session?.user) return;

      try {
        const response = await fetch('/api/money-mentor/history');
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }

        const data = await response.json();
        setMessages(data.messages);
        setContext(data.context);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    }

    fetchChatHistory();
  }, [session]);

  const sendMessage = async (content: string) => {
    if (!session?.user) return false;

    const userMessage: Message = {
      id: uuidv4(),
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Money Mentor');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: uuidv4(),
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
      const response = await fetch('/api/money-mentor/clear', {
        method: 'POST',
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
    sendMessage,
    clearChat,
  };
}
