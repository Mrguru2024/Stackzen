'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface ZenMission {
  id: string;
  title: string;
  description: string;
  type: 'savings' | 'spending' | 'income' | 'habit' | 'milestone';
  status: 'active' | 'completed' | 'failed';
  progress: number;
  target: number;
  reward: {
    type: 'points' | 'badge' | 'unlock' | 'bonus';
    value: string | number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  deadline?: string;
  streak?: number;
  category: 'emergency' | 'tax' | 'goals' | 'fun' | 'tools' | 'treat';
}

interface UserProfile {
  incomeType: 'regular' | 'irregular' | 'mixed';
  profession: string;
  savingGoals: string[];
  painPoints: string[];
}

const defaultMissions: ZenMission[] = [
  {
    id: 'emergency-100',
    title: 'Emergency Fund Builder',
    description: 'Save $100 for your emergency fund',
    type: 'savings',
    status: 'active',
    progress: 45,
    target: 100,
    reward: { type: 'badge', value: 'Safety Net' },
    difficulty: 'easy',
    category: 'emergency',
  },
  {
    id: 'tax-buffer',
    title: 'Tax Buffer Champion',
    description: 'Set aside 25% of your next income for taxes',
    type: 'savings',
    status: 'active',
    progress: 0,
    target: 1,
    reward: { type: 'points', value: 50 },
    difficulty: 'medium',
    category: 'tax',
  },
  {
    id: 'no-coffee-week',
    title: 'Coffee Shop Challenge',
    description: 'Skip coffee shops for a week and save the money',
    type: 'spending',
    status: 'active',
    progress: 3,
    target: 7,
    reward: { type: 'unlock', value: 'Premium Coffee Reward' },
    difficulty: 'medium',
    category: 'fun',
  },
  {
    id: 'income-streak',
    title: 'Income Streak',
    description: 'Receive income 3 days in a row',
    type: 'income',
    status: 'active',
    progress: 1,
    target: 3,
    reward: { type: 'bonus', value: 'Streak Bonus' },
    difficulty: 'hard',
    streak: 1,
    category: 'goals',
  },
];

export default function EnhancedZenMissions() {
  const { data: session } = useSession();
  const [missions, setMissions] = useState<ZenMission[]>(defaultMissions);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadMissions();
    loadUserProfile();
  }, []);

  const loadMissions = async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch('/api/smart-saving/missions');
      if (response.ok) {
        const data = await response.json();
        setMissions(data.missions || defaultMissions);
      }
    } catch (error) {
      console.error('Error loading missions:', error);
    }
  };

  const loadUserProfile = async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const _completeMission = async (missionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/smart-saving/missions/${missionId}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMissions(prev =>
          prev.map(mission =>
            mission.id === missionId
              ? { ...mission, status: 'completed', progress: mission.target }
              : mission
          )
        );

        // Show reward notification
        const mission = missions.find(m => m.id === missionId);
        if (mission) {
          toast.success(`🎉 Mission completed! You earned: ${mission.reward.value}`);
        }
      }
    } catch (error) {
      console.error('Error completing mission:', error);
      toast.error('Failed to complete mission');
    } finally {
      setLoading(false);
    }
  };

  const _getMissionIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      savings: Icons.piggyBank,
      spending: Icons.creditCard,
      income: Icons.trendingUp,
      habit: Icons.target,
      milestone: Icons.trophy,
    };
    return iconMap[type] || Icons.target;
  };

  const _getDifficultyColor = (difficulty: string) => {
    const colorMap: Record<string, string> = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800',
    };
    return colorMap[difficulty] || 'bg-gray-100 text-gray-800';
  };

  const _getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      emergency: 'bg-red-500',
      tax: 'bg-blue-500',
      goals: 'bg-green-500',
      fun: 'bg-yellow-500',
      tools: 'bg-purple-500',
      treat: 'bg-pink-500',
    };
    return colorMap[category] || 'bg-gray-500';
  };

  const activeMissions = missions.filter(m => m.status === 'active');
  const _completedMissions = missions.filter(m => m.status === 'completed');
  const totalProgress = missions.reduce((sum, m) => sum + m.progress, 0);
  const totalTarget = missions.reduce((sum, m) => sum + m.target, 0);
  const overallProgress = totalTarget > 0 ? (totalProgress / totalTarget) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.target className="h-5 w-5" />
          Zen Missions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered financial habits and behavioral nudges for your financial wellness journey.
        </p>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Missions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Active Missions</h3>
            <Badge variant="secondary">{activeMissions.length}</Badge>
          </div>

          {activeMissions.map(mission => {
            const _IconComponent = _getMissionIcon(mission.type);
            const _progressPercentage = (mission.progress / mission.target) * 100;

            return (
              <div key={mission.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <_IconComponent className="h-4 w-4" />
                    <div>
                      <h4 className="font-medium">{mission.title}</h4>
                      <p className="text-sm text-muted-foreground">{mission.description}</p>
                    </div>
                  </div>
                  <Badge className={_getDifficultyColor(mission.difficulty)}>
                    {mission.difficulty}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>
                      {mission.progress}/{mission.target}
                    </span>
                  </div>
                  <Progress value={_progressPercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${_getCategoryColor(mission.category)}`}
                    />
                    <span className="text-xs capitalize text-muted-foreground">
                      {mission.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Reward: {mission.reward.value}
                    </span>
                    {_progressPercentage >= 100 && (
                      <Button
                        size="sm"
                        onClick={() => _completeMission(mission.id)}
                        disabled={loading}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>

                {mission.streak && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <Icons.flame className="h-3 w-3" />
                    <span>{mission.streak} day streak</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completed Missions Toggle */}
        {_completedMissions.length > 0 && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full"
            >
              {showCompleted ? 'Hide' : 'Show'} Completed Missions ({_completedMissions.length})
            </Button>

            {showCompleted && (
              <div className="space-y-2">
                {_completedMissions.map(mission => (
                  <div key={mission.id} className="rounded-lg border bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium line-through">{mission.title}</h4>
                        <p className="text-xs text-muted-foreground">{mission.description}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        Completed
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Personalized Recommendations */}
        {userProfile && (
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <h4 className="mb-2 font-medium">💡 Personalized for You</h4>
            <p className="text-sm text-muted-foreground">
              Based on your {userProfile.incomeType} income pattern as a {userProfile.profession},
              we&apos;ve tailored these missions to help you build better financial habits.
            </p>
          </div>
        )}

        {/* Mission Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{_completedMissions.length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{activeMissions.length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {missions.reduce((sum, m) => sum + (m.streak || 0), 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Streaks</div>
          </div>
        </div>

        <span>Don&apos;t give up!</span>
      </CardContent>
    </Card>
  );
}
