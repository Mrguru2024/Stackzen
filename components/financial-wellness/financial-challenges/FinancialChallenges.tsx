'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Badge } from '@/components/ui';

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: number;
  reward: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  category: string;
}

interface FinancialChallengesProps {
  challenges?: Challenge[];
  onJoinChallenge?: (challengeId: string) => void;
}

export default function FinancialChallenges({
  challenges = [],
  onJoinChallenge,
}: FinancialChallengesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredChallenges =
    selectedCategory === 'all'
      ? challenges
      : challenges.filter(challenge => challenge.category === selectedCategory);

  const categories = ['all', ...new Set(challenges.map(c => c.category))];

  const getStatusColor = (status: Challenge['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Challenges</h2>
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredChallenges.map(challenge => (
          <Card key={challenge.id} className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-semibold">{challenge.title}</h3>
              <Badge className={`${getStatusColor(challenge.status)} capitalize text-white`}>
                {challenge.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="mb-4 text-sm text-gray-600">{challenge.description}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{challenge.progress}%</span>
              </div>
              <Progress value={challenge.progress} className="h-2" />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Duration: {challenge.duration} days</span>
                <span>Reward: {challenge.reward}</span>
              </div>
              {challenge.status === 'not_started' && (
                <Button className="mt-4 w-full" onClick={() => onJoinChallenge?.(challenge.id)}>
                  Join Challenge
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
