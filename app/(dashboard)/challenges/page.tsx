'use client';

import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Icons } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';

// Temporary mock data
const mockActiveChallenges = [
  {
    id: '1',
    title: 'No-Spend Weekend',
    description: 'Avoid unnecessary spending for an entire weekend',
    startDate: '2024-03-15',
    endDate: '2024-03-17',
    targetAmount: 100,
    currentAmount: 75,
    participants: 45,
    status: 'active',
  },
  {
    id: '2',
    title: 'Coffee Break Challenge',
    description: 'Skip your daily coffee shop visit for a week',
    startDate: '2024-03-20',
    endDate: '2024-03-27',
    targetAmount: 50,
    currentAmount: 35,
    participants: 28,
    status: 'active',
  },
];

const mockAvailableChallenges = [
  {
    id: '3',
    title: 'Meal Prep Master',
    description: 'Cook all your meals at home for two weeks',
    startDate: '2024-04-01',
    endDate: '2024-04-14',
    targetAmount: 200,
    participants: 0,
    status: 'upcoming',
  },
  {
    id: '4',
    title: 'Subscription Cleanup',
    description: 'Review and cancel unused subscriptions',
    startDate: '2024-04-15',
    endDate: '2024-04-30',
    targetAmount: 150,
    participants: 0,
    status: 'upcoming',
  },
];

export default function ChallengesPage() {
  const [activeChallenges, setActiveChallenges] = useState(mockActiveChallenges);
  const [availableChallenges, setAvailableChallenges] = useState(mockAvailableChallenges);

  const handleJoinChallenge = (challengeId: string) => {
    const challenge = availableChallenges.find(c => c.id === challengeId);
    if (challenge) {
      setAvailableChallenges(availableChallenges.filter(c => c.id !== challengeId));
      setActiveChallenges([
        ...activeChallenges,
        {
          ...challenge,
          currentAmount: 0,
          participants: 1,
          status: 'active',
        },
      ]);
    }
  };

  const handleCompleteChallenge = (challengeId: string) => {
    setActiveChallenges(
      activeChallenges.map(challenge =>
        challenge.id === challengeId ? { ...challenge, status: 'completed' } : challenge
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-8 pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Challenges</h1>
          <p className="text-muted-foreground">Join challenges to boost your savings</p>
        </div>
        <ThemeToggle />
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Challenges</TabsTrigger>
          <TabsTrigger value="available">Available Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeChallenges.map(challenge => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    <Badge variant={challenge.status === 'completed' ? 'default' : 'secondary'}>
                      {challenge.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          ${challenge.currentAmount} / ${challenge.targetAmount}
                        </span>
                      </div>
                      <Progress value={(challenge.currentAmount / challenge.targetAmount) * 100} />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {new Date(challenge.startDate).toLocaleDateString()} -{' '}
                        {new Date(challenge.endDate).toLocaleDateString()}
                      </span>
                      <span>{challenge.participants} participants</span>
                    </div>
                    {challenge.status === 'active' && (
                      <Button
                        className="w-full"
                        onClick={() => handleCompleteChallenge(challenge.id)}
                      >
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableChallenges.map(challenge => (
              <Card key={challenge.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {new Date(challenge.startDate).toLocaleDateString()} -{' '}
                        {new Date(challenge.endDate).toLocaleDateString()}
                      </span>
                      <span>Target: ${challenge.targetAmount}</span>
                    </div>
                    <Button className="w-full" onClick={() => handleJoinChallenge(challenge.id)}>
                      Join Challenge
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
