import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { callFinGPT } from '@/lib/ai/fingpt';
// import { callOpenAI, callClaude, callPerplexity } from '@/lib/ai/providers'; // Placeholder for other LLMs

export type ChatModel = 'OpenAI' | 'Claude' | 'Perplexity' | 'FinGPT';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: ChatModel;
}

interface AskStackrState {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  model: ChatModel;
  models: ChatModel[];
  setInput: (input: string) => void;
  setModel: (model: ChatModel) => void;
  sendMessage: () => Promise<void>;
}

export const _useAskStackrStore = create<AskStackrState>((set, get) => ({
  messages: [],
  input: '',
  loading: false,
  model: 'FinGPT',
  models: ['OpenAI', 'Claude', 'Perplexity', 'FinGPT'],
  setInput: input => set({ input }),
  setModel: model => set({ model }),
  sendMessage: async () => {
    const { input, model, messages } = get();
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: nanoid(),
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
      id: nanoid(),
      role: 'assistant',
      content: '',
      model,
    };
    try {
      let response = '';
      if (model === 'FinGPT') {
        response = await callFinGPT(input);
      } else if (model === 'OpenAI') {
        response = 'OpenAI integration coming soon!'; // Replace with real call
        // response = await callOpenAI(input, messages);
      } else if (model === 'Claude') {
        response = 'Claude integration coming soon!'; // Replace with real call
        // response = await callClaude(input, messages);
      } else if (model === 'Perplexity') {
        response = 'Perplexity integration coming soon!'; // Replace with real call
        // response = await callPerplexity(input, messages);
      }
      assistantMsg.content = response;
    } catch (err: any) {
      assistantMsg.content = 'Error: ' + err.message;
    }
    set(state => ({
      messages: [...state.messages, assistantMsg],
      loading: false,
    }));
  },
}));
