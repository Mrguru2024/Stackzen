import { create } from 'zustand';
import { requestAiGenerate } from '@/lib/ai/client-generate';

export type ChatModel = 'StackZen AI';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: ChatModel;
}

interface AskStackZenState {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  model: ChatModel;
  models: ChatModel[];
  setInput: (input: string) => void;
  setModel: (model: ChatModel) => void;
  sendMessage: () => Promise<void>;
}

export const _useAskStackZenStore = create<AskStackZenState>((set, get) => ({
  messages: [],
  input: '',
  loading: false,
  model: 'StackZen AI',
  models: ['StackZen AI'],
  setInput: input => set({ input }),
  setModel: model => set({ model }),
  sendMessage: async () => {
    const { input, model, messages } = get();
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      model,
    };
    set(state => ({
      messages: [...state.messages, userMsg],
      input: '',
      loading: true,
    }));
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      model,
    };
    try {
      const historyContext = messages.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');
      const prompt =
        messages.length > 0
          ? `Prior conversation:\n${historyContext}\n\nUser: ${input}`
          : input;

      const data = await requestAiGenerate({
        message: prompt,
        task: 'financial_guidance',
      });
      assistantMsg.content = data.response;
    } catch (err: unknown) {
      assistantMsg.content =
        'Error: ' + (err instanceof Error ? err.message : 'Could not reach StackZen AI');
    }
    set(state => ({
      messages: [...state.messages, assistantMsg],
      loading: false,
    }));
  },
}));

export const useAskStackZenStore = _useAskStackZenStore;
