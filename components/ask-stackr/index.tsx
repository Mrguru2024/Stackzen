import React, { useRef, useEffect } from 'react';
import { useAskStackrStore } from './store.ts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
}

export default function AskStackr() {
  const { messages, input, setInput, sendMessage, loading, model, setModel, models } =
    useAskStackrStore();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="mx-auto flex h-[70vh] w-full max-w-2xl flex-col gap-4 rounded-lg bg-white p-6 shadow-md dark:bg-zinc-900">
      <h2 className="mb-2 text-2xl font-bold">Ask Stackr</h2>
      <div className="mb-2 flex items-center gap-2">
        <label htmlFor="model" className="font-medium">
          Model:
        </label>
        <select
          id="model"
          value={model}
          onChange={e => setModel(e.target.value)}
          className="select select-bordered"
        >
          {models.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto rounded bg-zinc-100 p-4 dark:bg-zinc-800">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-zinc-200 text-black dark:bg-zinc-700 dark:text-white'}`}
            >
              <span className="mb-1 block text-xs opacity-60">{msg.model}</span>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="mb-2 flex justify-start">
            <div className="animate-pulse rounded-lg bg-zinc-200 px-3 py-2 text-black dark:bg-zinc-700 dark:text-white">
              <span className="mb-1 block text-xs opacity-60">{model}</span>
              Stackr is typing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="input input-bordered flex-1"
          placeholder="Ask anything..."
          disabled={loading}
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
