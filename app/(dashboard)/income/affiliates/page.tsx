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
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Users, DollarSign, ArrowUpRight, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface AffiliateProgram {
  id: string;
  name: string;
  description: string;
  category: string;
  commission: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  potentialEarnings: number;
  requirements: string[];
  isProOnly: boolean;
  aiScore: number;
}

export default function AffiliateProgramPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('recommended');
  const isPro = user?.subscription?.status === 'active';

  // Fetch affiliate programs data
  const {
    data: affiliatePrograms,
    isLoading,
    error,
  } = useQuery<AffiliateProgram[]>({
    queryKey: ['/api/affiliate-programs'],
    queryFn: async () => {
      const response = await fetch('/api/affiliate-programs');
      if (!response.ok) {
        throw new Error('Failed to fetch affiliate programs');
      }
      return response.json();
    },
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'tech', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'education', label: 'Education' },
    { value: 'health', label: 'Health & Wellness' },
    { value: 'lifestyle', label: 'Lifestyle' },
  ];

  const filteredPrograms = affiliatePrograms?.filter(program => {
    if (activeTab === 'recommended') {
      return program.aiScore >= 8;
    }
    return true;
  });

  return (
    <div className="container mx-auto space-y-8 py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Program Hub</h1>
          <p className="text-muted-foreground">
            AI-recommended passive income affiliate opportunities
          </p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/income/affiliates/my-links')}>
          <Users size={16} />
          My Affiliate Links
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$0.00</div>
            <p className="text-sm text-muted-foreground">
              Lifetime earnings from affiliate programs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">
              Programs you&apos;re currently promoting
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">-</div>
            <p className="text-sm text-muted-foreground">Your profile match score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recommended" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recommended">AI Recommended</TabsTrigger>
          <TabsTrigger value="all">All Programs</TabsTrigger>
          <TabsTrigger value="pro">Pro Programs</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500">
                Failed to load affiliate programs. Please try again later.
              </p>
            </div>
          ) : !affiliatePrograms?.length ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No affiliate programs found.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms?.map(program => (
                <Card key={program.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    {program.isProOnly && <Badge className="mb-2 w-fit">Pro Only</Badge>}
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{program.name}</CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Brain className="h-3 w-3" />
                        {program.aiScore}/10
                      </Badge>
                    </div>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">Commission</span>
                          <span className="font-medium">{program.commission}</span>
                        </div>
                        <Progress value={program.aiScore * 10} className="h-2" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />${program.potentialEarnings}/mo
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {program.difficulty}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {program.requirements.map(req => (
                          <Badge key={req} variant="secondary">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      disabled={program.isProOnly && !isPro}
                      onClick={() => {
                        if (program.isProOnly && !isPro) return;
                        router.push(`/income/affiliates/my-links?programId=${program.id}`);
                      }}
                    >
                      {program.isProOnly && !isPro ? 'Requires Pro Subscription' : 'Learn More'}
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
