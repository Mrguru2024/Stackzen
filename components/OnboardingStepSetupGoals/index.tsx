'use client';

import React, { useState } from 'react';

interface OnboardingStepSetupGoalsProps {
  onNext: (goals: string[]) => void;
}

const OnboardingStepSetupGoals: React.FC<OnboardingStepSetupGoalsProps> = ({ onNext }) => {
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');

  const _handleAddGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onNext(goals);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-3xl font-bold">Setup Your Goals</h1>
      <p className="mb-6">Please add your financial goals.</p>
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <div className="mb-4">
          <input
            type="text"
            value={newGoal}
            onChange={e => setNewGoal(e.target.value)}
            className="rounded border p-2"
            placeholder="Enter a goal"
          />
          <button
            type="button"
            onClick={_handleAddGoal}
            className="ml-2 rounded bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
          >
            Add Goal
          </button>
        </div>
        <ul className="mb-4">
          {goals.map((goal, index) => (
            <li key={index} className="mb-2">
              {goal}
            </li>
          ))}
        </ul>
        <button
          type="submit"
          className="rounded bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600"
        >
          Next
        </button>
      </form>
    </div>
  );
};

export default OnboardingStepSetupGoals;
