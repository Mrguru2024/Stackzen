import React, { useState } from 'react';
import { callFinGPT } from '@/lib/ai/fingpt';

export interface PlanningCoachProps {
  income: number;
  expenses: number;
  timeOffDays?: number;
}

export default function PlanningCoach({ income, expenses, timeOffDays = 0 }: PlanningCoachProps) {
  const [question, setQuestion] = useState('Can I afford to take time off next month?');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    const prompt = `My monthly income is $${income}, my expenses are $${expenses}, and I want to take ${timeOffDays} days off next month. ${question}`;
    try {
      const response = await callFinGPT(prompt);
      setAnswer(response);
    } catch (err: any) {
      setAnswer('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-lg bg-white p-6 shadow-md dark:bg-zinc-900">
      <h2 className="mb-2 text-2xl font-bold">Planning Coach</h2>
      <div className="flex flex-col gap-2">
        <label htmlFor="income" className="font-medium">
          Monthly Income
        </label>
        <input
          id="income"
          type="number"
          value={income}
          readOnly
          className="input input-bordered"
          placeholder="Monthly Income"
        />
        <label htmlFor="expenses" className="font-medium">
          Monthly Expenses
        </label>
        <input
          id="expenses"
          type="number"
          value={expenses}
          readOnly
          className="input input-bordered"
          placeholder="Monthly Expenses"
        />
        <label htmlFor="timeOffDays" className="font-medium">
          Time Off (days)
        </label>
        <input
          id="timeOffDays"
          type="number"
          value={timeOffDays}
          readOnly
          className="input input-bordered"
          placeholder="Time Off Days"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="question" className="font-medium">
          Ask a question
        </label>
        <input
          id="question"
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="input input-bordered"
          placeholder="Type your question here"
        />
        <button onClick={handleAsk} className="btn btn-primary mt-2" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask Coach'}
        </button>
      </div>
      {answer && (
        <div className="mt-4 rounded bg-zinc-100 p-4 dark:bg-zinc-800">
          <span className="font-semibold">Coach says:</span>
          <div className="mt-2 whitespace-pre-line">{answer}</div>
        </div>
      )}
    </div>
  );
}
