'use client';

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Info } from 'lucide-react';
import { _useMoneyMentor } from '@/hooks/useMoneyMentor';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface MoneyMentorProps {
  userId: string;
}

export default function MoneyMentor({ userId }: MoneyMentorProps) {
  const { messages, loading, error, sendMessage } = _useMoneyMentor();
  const [input, setInput] = useState('');
  const _messagesEndRef = useRef<HTMLDivElement>(null);
  const _inputRef = useRef<HTMLTextAreaElement>(null);

  const _scrollToBottom = () => {
    _messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    _scrollToBottom();
  }, [messages]);

  const _handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const _success = await sendMessage(input);
    if (_success) {
      setInput('');
      _inputRef.current?.focus();
    }
  };

  const _handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      _handleSubmit(e);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Money Mentor AI</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your AI financial guide for general suggestions and educational insights
            </p>
          </div>
          <Link
            href="/financial-mentorship"
            className="inline-flex items-center rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            <Info className="mr-2 h-4 w-4" />
            Connect with Human Mentor
          </Link>
        </div>
        <div className="mt-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Note: I provide general suggestions and educational insights only. For specific
            financial advice, please consult with our human financial mentors.
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
        <AnimatePresence>
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex items-start gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="mt-1 block text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {message.role === 'user' && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Money Mentor is thinking...</span>
          </div>
        )}
        <div ref={_messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={_handleSubmit} className="relative">
        <textarea
          ref={_inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={_handleKeyDown}
          placeholder="Ask about general financial concepts or get educational insights..."
          className="w-full resize-none rounded-lg border border-gray-300 bg-white p-4 pr-12 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          rows={3}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute bottom-3 right-3 rounded-full bg-blue-500 p-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-4 text-red-500 dark:bg-red-900/20">{error}</div>
      )}
    </div>
  );
}
