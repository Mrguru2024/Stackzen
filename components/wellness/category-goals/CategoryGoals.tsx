'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { WellnessScore, type CategoryGoal } from '@/lib/types/wellness';
import { _WELLNESS_CATEGORY_VALUES } from '@/lib/constants/wellness';
import { _formatCurrency } from '@/lib/utils/format';

interface CategoryGoalsProps {
  scores: WellnessScore[];
  goals: CategoryGoal[];
  onAddGoal: (goal: Omit<CategoryGoal, 'id'>) => void;
  onUpdateGoal: (goal: CategoryGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  className?: string;
}

const _CATEGORY_COLORS: Record<string, string> = {
  physical: '#4AE66C',
  mental: '#5E2DEB',
  financial: '#FF4B4B',
  social: '#F79C42',
  career: '#00B4D8',
};

export default function CategoryGoals({
  scores,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  className = '',
}: CategoryGoalsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CategoryGoal | null>(null);

  const _latestScore = scores[scores.length - 1];
  const _categoryGoals = goals.filter(goal => goal.category === selectedCategory);

  const _handleAddGoal = () => {
    if (!selectedCategory || !_latestScore) return;
    const categoryScore = _latestScore.categoryScores[selectedCategory];
    onAddGoal({
      category: selectedCategory,
      name: `Improve ${selectedCategory}`,
      target: 100,
      current: categoryScore?.score ?? 0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    setShowGoalForm(false);
  };

  const _handleUpdateGoal = (goal: CategoryGoal) => {
    onUpdateGoal(goal);
    setEditingGoal(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Category Goals</h3>
          <Button onClick={() => setShowGoalForm(true)} className="bg-primary hover:bg-primary/90">
            Add Goal
          </Button>
        </div>

        {/* Category Selection */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          {_WELLNESS_CATEGORY_VALUES.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="flex items-center justify-start"
              onClick={() => setSelectedCategory(category)}
            >
              <div
                className="mr-2 h-3 w-3 rounded-full"
                style={{
                  backgroundColor: _CATEGORY_COLORS[category] ?? '#6366f1',
                }}
              />
              <span className="capitalize">{category}</span>
            </Button>
          ))}
        </div>

        {/* Goals List */}
        {selectedCategory && (
          <div className="space-y-4">
            {_categoryGoals.map(goal => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border bg-card p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{goal.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Target: {_formatCurrency(goal.target)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingGoal(goal)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => onDeleteGoal(goal.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <Progress
                  value={(goal.current / goal.target) * 100}
                  className="h-2"
                  style={
                    {
                      backgroundColor: `${(_CATEGORY_COLORS[selectedCategory] ?? '#6366f1')}20`,
                      '--progress-foreground': _CATEGORY_COLORS[selectedCategory] ?? '#6366f1',
                    } as React.CSSProperties
                  }
                />
                <div className="mt-2 flex justify-between text-sm">
                  <span>Current: {_formatCurrency(goal.current)}</span>
                  <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Goal Form Dialog */}
        {showGoalForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md p-6">
              <h4 className="mb-4 text-lg font-semibold">Add New Goal</h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="category-select" className="text-sm font-medium">
                    Category
                  </label>
                  <select
                    id="category-select"
                    className="mt-1 w-full rounded-md border p-2"
                    value={selectedCategory || ''}
                    onChange={e => setSelectedCategory(e.target.value)}
                    aria-label="Select a category"
                  >
                    <option value="">Select a category</option>
                    {_WELLNESS_CATEGORY_VALUES.map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowGoalForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={_handleAddGoal} disabled={!selectedCategory}>
                    Add Goal
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Goal Dialog */}
        {editingGoal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md p-6">
              <h4 className="mb-4 text-lg font-semibold">Edit Goal</h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="goal-name" className="text-sm font-medium">
                    Name
                  </label>
                  <input
                    id="goal-name"
                    type="text"
                    className="mt-1 w-full rounded-md border p-2"
                    value={editingGoal.name}
                    onChange={e => setEditingGoal({ ...editingGoal, name: e.target.value })}
                    aria-label="Goal name"
                  />
                </div>
                <div>
                  <label htmlFor="goal-target" className="text-sm font-medium">
                    Target
                  </label>
                  <input
                    id="goal-target"
                    type="number"
                    className="mt-1 w-full rounded-md border p-2"
                    value={editingGoal.target}
                    onChange={e =>
                      setEditingGoal({
                        ...editingGoal,
                        target: Number(e.target.value),
                      })
                    }
                    aria-label="Goal target amount"
                  />
                </div>
                <div>
                  <label htmlFor="goal-current" className="text-sm font-medium">
                    Current
                  </label>
                  <input
                    id="goal-current"
                    type="number"
                    className="mt-1 w-full rounded-md border p-2"
                    value={editingGoal.current}
                    onChange={e =>
                      setEditingGoal({
                        ...editingGoal,
                        current: Number(e.target.value),
                      })
                    }
                    aria-label="Current goal progress"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingGoal(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => _handleUpdateGoal(editingGoal)}>Save Changes</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
