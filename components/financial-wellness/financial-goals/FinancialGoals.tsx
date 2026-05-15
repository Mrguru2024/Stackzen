'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import Progress from '@/components/ui/progress';

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
}

interface FinancialGoalsProps {
  goals?: FinancialGoal[];
  onAddGoal?: (goal: Omit<FinancialGoal, 'id'>) => void;
}

export default function FinancialGoals({ goals = [], onAddGoal }: FinancialGoalsProps) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<FinancialGoal>>({});

  const handleAddGoal = () => {
    if (newGoal.title && newGoal.targetAmount && newGoal.deadline) {
      onAddGoal?.({
        title: newGoal.title,
        targetAmount: newGoal.targetAmount,
        currentAmount: 0,
        deadline: newGoal.deadline,
        category: newGoal.category || 'General',
      });
      setNewGoal({});
      setIsAddingGoal(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Goals</h2>
        <Button onClick={() => setIsAddingGoal(true)}>Add Goal</Button>
      </div>

      {isAddingGoal && (
        <div className="mb-6 rounded-lg border p-4">
          <Input
            placeholder="Goal Title"
            value={newGoal.title || ''}
            onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
            className="mb-2"
          />
          <Input
            type="number"
            placeholder="Target Amount"
            value={newGoal.targetAmount || ''}
            onChange={e => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
            className="mb-2"
          />
          <Input
            type="date"
            value={newGoal.deadline ? new Date(newGoal.deadline).toISOString().split('T')[0] : ''}
            onChange={e => setNewGoal({ ...newGoal, deadline: new Date(e.target.value) })}
            className="mb-2"
          />
          <div className="flex gap-2">
            <Button onClick={handleAddGoal}>Save</Button>
            <Button variant="outline" onClick={() => setIsAddingGoal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {goals.map(goal => (
          <Card key={goal.id} className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{goal.title}</h3>
                <p className="text-sm text-gray-500">{goal.category}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${goal.currentAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">of ${goal.targetAmount.toLocaleString()}</p>
              </div>
            </div>
            <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="mb-2" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
              <span>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}% Complete</span>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
