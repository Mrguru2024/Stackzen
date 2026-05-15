'use client';

import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import Progress from '@/components/ui/progress';
import { Icons } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GoalDialog } from '@/components/goals/goal-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Temporary mock data
const mockGoals = [
  {
    id: '1',
    title: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 6500,
    deadline: '2024-12-31',
    category: 'Savings',
  },
  {
    id: '2',
    title: 'New Car Down Payment',
    targetAmount: 5000,
    currentAmount: 2500,
    deadline: '2024-08-31',
    category: 'Major Purchase',
  },
  {
    id: '3',
    title: 'Vacation Fund',
    targetAmount: 3000,
    currentAmount: 1200,
    deadline: '2024-07-31',
    category: 'Travel',
  },
];

const categories = ['Savings', 'Major Purchase', 'Travel', 'Education', 'Investment', 'Other'];

export default function GoalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [goals, setGoals] = useState(mockGoals);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('stackzen.goals');
      if (raw) {
        const parsed = JSON.parse(raw) as typeof mockGoals;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGoals(parsed);
        }
      }
    } catch {
      // keep defaults
    }
  }, []);

  const persistGoals = (nextGoals: typeof mockGoals) => {
    setGoals(nextGoals);
    localStorage.setItem('stackzen.goals', JSON.stringify(nextGoals));
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddGoal = (data: any) => {
    const newGoal = {
      id: Math.random().toString(36).substr(2, 9),
      title: data.title,
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: parseFloat(data.currentAmount),
      deadline: data.deadline,
      category: data.category,
    };
    persistGoals([...goals, newGoal]);
  };

  const handleEditGoal = (id: string, data: any) => {
    persistGoals(
      goals.map(goal =>
        goal.id === id
          ? {
              ...goal,
              title: data.title,
              targetAmount: parseFloat(data.targetAmount),
              currentAmount: parseFloat(data.currentAmount),
              deadline: data.deadline,
              category: data.category,
            }
          : goal
      )
    );
  };

  const handleDeleteGoal = (id: string) => {
    persistGoals(goals.filter(goal => goal.id !== id));
  };

  const totalProgress =
    goals.reduce((acc, goal) => acc + (goal.currentAmount / goal.targetAmount) * 100, 0) /
    goals.length;

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between pb-8 pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground">Track and manage your financial goals</p>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <GoalDialog mode="add" onSubmit={handleAddGoal} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goals Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProgress.toFixed(1)}%</div>
                <Progress value={totalProgress} className="mt-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Average completion across all goals
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Goals List</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search goals..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGoals.map(goal => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <GoalDialog
                        mode="edit"
                        goal={goal}
                        onSubmit={data => handleEditGoal(goal.id, data)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
                        <Icons.trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{goal.category}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                      </span>
                    </div>
                    <Progress value={(goal.currentAmount / goal.targetAmount) * 100} />
                    <p className="text-xs text-muted-foreground">
                      Target: {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
