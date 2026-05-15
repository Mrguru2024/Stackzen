'use client';

import React from 'react';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, Target, Calendar, Users, Star, Award, Medal, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'challenge' | 'streak' | 'milestone' | 'special';
  progress: number;
  target: number;
  reward: {
    type: string;
    amount: number;
  };
  unlockedAt?: string;
  icon: 'trophy' | 'star' | 'medal' | 'crown';
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
    queryFn: async () => {
      const response = await fetch('/api/achievements');
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      return response.json();
    },
  });

  const filteredAchievements = achievements?.filter(achievement => {
    if (activeTab === 'all') return true;
    return achievement.category === activeTab;
  });

  const unlockedAchievements = achievements?.filter(a => a.unlockedAt) || [];
  const totalRewards = unlockedAchievements.reduce((sum, a) => sum + a.reward.amount, 0);

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'trophy':
        return <Trophy className="h-6 w-6" />;
      case 'star':
        return <Star className="h-6 w-6" />;
      case 'medal':
        return <Medal className="h-6 w-6" />;
      case 'crown':
        return <Crown className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  return (
    <div className="container mx-auto space-y-8 py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">Track your progress and unlock rewards</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unlocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {unlockedAchievements.length}/{achievements?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Achievements unlocked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalRewards}</div>
            <p className="text-sm text-muted-foreground">Earned from achievements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {achievements?.length
                ? Math.round((unlockedAchievements.length / achievements.length) * 100)
                : 0}
              %
            </div>
            <p className="text-sm text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="challenge">Challenges</TabsTrigger>
          <TabsTrigger value="streak">Streaks</TabsTrigger>
          <TabsTrigger value="milestone">Milestones</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAchievements?.map(achievement => (
                <Card key={achievement.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getIcon(achievement.icon)}
                        <CardTitle className="text-xl">{achievement.title}</CardTitle>
                      </div>
                      {achievement.unlockedAt && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Trophy className="h-3 w-3" />
                          Unlocked
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {achievement.progress}/{achievement.target}
                          </span>
                        </div>
                        <Progress
                          value={(achievement.progress / achievement.target) * 100}
                          className="h-2"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {achievement.reward.type}: ${achievement.reward.amount}
                        </Badge>
                        {achievement.unlockedAt && (
                          <span className="text-sm text-muted-foreground">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
