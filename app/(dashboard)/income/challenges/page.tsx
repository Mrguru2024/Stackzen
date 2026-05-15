'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trophy, Target, Calendar, Users, ArrowUpRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  target: number;
  duration: number; // in days
  participants: number;
  startDate: string;
  endDate: string;
  progress: number;
  rewards: {
    type: string;
    amount: number;
  }[];
  isProOnly: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export default function MoneyChallengesPage() {
  const { user } = useAuth();
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const isPro =
    user?.subscription?.plan === 'pro' || sessionRole === 'SUPER_ADMIN';

  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ['/api/challenges'],
    queryFn: async () => {
      const response = await fetch('/api/challenges');
      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }
      return response.json();
    },
  });

  const filteredChallenges = challenges?.filter(challenge => {
    if (activeTab === 'active') {
      return new Date(challenge.endDate) > new Date();
    } else if (activeTab === 'completed') {
      return challenge.progress >= 100;
    }
    return true;
  });

  const handleChallengeAction = (challenge: Challenge) => {
    if (challenge.isProOnly && !isPro) return;
    if (challenge.progress >= 100) {
      router.push('/income/challenges/achievements');
      return;
    }

    const raw = localStorage.getItem('stackzen.joinedChallenges');
    const joinedIds = raw ? (JSON.parse(raw) as string[]) : [];
    if (!joinedIds.includes(challenge.id)) {
      localStorage.setItem('stackzen.joinedChallenges', JSON.stringify([challenge.id, ...joinedIds]));
    }

    toast({
      title: 'Challenge joined',
      description: `${challenge.title} has been added to your active challenge list.`,
    });
    router.push('/income/challenges/achievements');
  };

  return (
    <div className="container mx-auto space-y-8 py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Money Challenges</h1>
          <p className="text-muted-foreground">
            Track and participate in income-generating challenges
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/income/challenges/achievements">
            <Button variant="outline" className="gap-2">
              <Trophy size={16} />
              Achievements
            </Button>
          </Link>
          <Link href="/income/challenges/create">
            <Button className="gap-2">
              <Target size={16} />
              Create Challenge
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {challenges?.filter(c => new Date(c.endDate) > new Date()).length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Challenges in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              $
              {challenges?.reduce(
                (sum, c) => sum + c.rewards.reduce((r, s) => r + s.amount, 0),
                0
              ) || 0}
            </div>
            <p className="text-sm text-muted-foreground">Potential earnings from challenges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {challenges?.length
                ? Math.round(
                    (challenges.filter(c => c.progress >= 100).length / challenges.length) * 100
                  )
                : 0}
              %
            </div>
            <p className="text-sm text-muted-foreground">Completed challenges</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Challenges</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredChallenges?.map(challenge => (
                <Card key={challenge.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    {challenge.isProOnly && <Badge className="mb-2 w-fit">Pro Only</Badge>}
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{challenge.title}</CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Target className="h-3 w-3" />${challenge.target}
                      </Badge>
                    </div>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{challenge.progress}%</span>
                        </div>
                        <Progress value={challenge.progress} className="h-2" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {challenge.duration} days
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {challenge.participants} joined
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {challenge.rewards.map((reward, index) => (
                          <Badge key={index} variant="secondary">
                            {reward.type}: ${reward.amount}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      disabled={challenge.isProOnly && !isPro}
                      onClick={() => handleChallengeAction(challenge)}
                    >
                      {challenge.isProOnly && !isPro
                        ? 'Requires Pro Subscription'
                        : challenge.progress >= 100
                          ? 'Completed'
                          : 'Join Challenge'}
                      <ArrowUpRight size={16} />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
