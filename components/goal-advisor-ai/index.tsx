import React, { useState } from 'react';
import { requestAiGenerate } from '@/lib/ai/client-generate';

export interface GoalAdvisorAIProps {
  goal: string;
  targetAmount: number;
  currentSavings: number;
  targetDate: string; // ISO date string
}

export default function GoalAdvisorAI({
  goal,
  targetAmount,
  currentSavings,
  targetDate,
}: GoalAdvisorAIProps) {
  const [question, setQuestion] = useState('How can I reach my goal faster?');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    const prompt = `My goal is: ${goal}. My target amount is $${targetAmount}, I currently have $${currentSavings} saved, and my target date is ${targetDate}. ${question}`;
    try {
      const data = await requestAiGenerate({
        message: prompt,
        task: 'financial_guidance',
      });
      setAnswer(data.response);
    } catch (err: any) {
      setAnswer('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-lg bg-white p-6 shadow-md dark:bg-zinc-900">
      <h2 className="mb-2 text-2xl font-bold">Goal Advisor AI</h2>
      <div className="flex flex-col gap-2">
        <label htmlFor="goal" className="font-medium">
          Goal
        </label>
        <input
          id="goal"
          type="text"
          value={goal}
          readOnly
          className="input input-bordered"
          placeholder="Goal"
        />
        <label htmlFor="targetAmount" className="font-medium">
          Target Amount
        </label>
        <input
          id="targetAmount"
          type="number"
          value={targetAmount}
          readOnly
          className="input input-bordered"
          placeholder="Target Amount"
        />
        <label htmlFor="currentSavings" className="font-medium">
          Current Savings
        </label>
        <input
          id="currentSavings"
          type="number"
          value={currentSavings}
          readOnly
          className="input input-bordered"
          placeholder="Current Savings"
        />
        <label htmlFor="targetDate" className="font-medium">
          Target Date
        </label>
        <input
          id="targetDate"
          type="date"
          value={targetDate}
          readOnly
          className="input input-bordered"
          placeholder="Target Date"
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
          {loading ? 'Thinking...' : 'Ask Advisor'}
        </button>
      </div>
      {answer && (
        <div className="mt-4 rounded bg-zinc-100 p-4 dark:bg-zinc-800">
          <span className="font-semibold">Advisor says:</span>
          <div className="mt-2 whitespace-pre-line">{answer}</div>
        </div>
      )}
    </div>
  );
}
