'use client';

import React from 'react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Brain, Shield, ArrowUpRight, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Investment {
  id: string;
  name: string;
  description: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  potentialReturn: number;
  minimumInvestment: number;
  aiScore: number;
  marketTrend: 'up' | 'down' | 'stable';
  isProOnly: boolean;
  features: string[];
}

export default function InvestmentWizardPage() {
  const { user } = useAuth();
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ai-recommended');
  const sessionRole = (session?.user as { role?: string; subscriptionLevel?: string } | undefined)
    ?.role;
  const sessionTier = (session?.user as { subscriptionLevel?: string } | undefined)
    ?.subscriptionLevel;
  const isPro =
    user?.subscription?.plan === 'pro' ||
    sessionTier === 'PRO' ||
    sessionRole === 'SUPER_ADMIN';

  const { data: investments, isLoading } = useQuery<Investment[]>({
    queryKey: ['/api/investments'],
    queryFn: async () => {
      const response = await fetch('/api/investments');
      if (!response.ok) {
        throw new Error('Failed to fetch investments');
      }
      return response.json();
    },
  });

  const filteredInvestments = investments?.filter(investment => {
    if (activeTab === 'ai-recommended') {
      return investment.aiScore >= 80;
    } else if (activeTab === 'pro') {
      return investment.isProOnly;
    }
    return true;
  });

  return (
    <div className="container mx-auto space-y-8 py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Wizard</h1>
          <p className="text-muted-foreground">
            AI-powered investment recommendations and portfolio tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/income/investments/ai-analysis">
            <Button variant="outline" className="gap-2">
              <Brain size={16} />
              AI Analysis
            </Button>
          </Link>
          <Link href="/income/investments/portfolio">
            <Button className="gap-2">
              <TrendingUp size={16} />
              Portfolio
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${investments?.reduce((sum, i) => sum + i.minimumInvestment, 0) || 0}
            </div>
            <p className="text-sm text-muted-foreground">Minimum investment required</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {investments?.length
                ? Math.round(
                    investments.reduce((sum, i) => sum + i.aiScore, 0) / investments.length
                  )
                : 0}
              %
            </div>
            <p className="text-sm text-muted-foreground">Average AI recommendation score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {investments?.length
                ? Math.round(
                    (investments.filter(i => i.riskLevel === 'low').length / investments.length) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-sm text-muted-foreground">Low-risk opportunities</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ai-recommended" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ai-recommended">AI Recommended</TabsTrigger>
          <TabsTrigger value="all">All Opportunities</TabsTrigger>
          <TabsTrigger value="pro">Pro Opportunities</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredInvestments?.map(investment => (
                <Card key={investment.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    {investment.isProOnly && <Badge className="mb-2 w-fit">Pro Only</Badge>}
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{investment.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${
                          investment.marketTrend === 'up'
                            ? 'text-green-500'
                            : investment.marketTrend === 'down'
                              ? 'text-red-500'
                              : ''
                        }`}
                      >
                        {investment.marketTrend === 'up' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : investment.marketTrend === 'down' ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Shield className="h-3 w-3" />
                        )}
                        {investment.marketTrend}
                      </Badge>
                    </div>
                    <CardDescription>{investment.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">AI Score</span>
                          <span className="font-medium">{investment.aiScore}%</span>
                        </div>
                        <Progress value={investment.aiScore} className="h-2" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          {investment.riskLevel} risk
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {investment.potentialReturn}% return
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {investment.features.map((feature, index) => (
                          <Badge key={index} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-between"
                      disabled={investment.isProOnly && !isPro}
                      onClick={() => {
                        if (investment.isProOnly && !isPro) return;
                        router.push(`/income/investments/portfolio?investmentId=${investment.id}`);
                      }}
                    >
                      {investment.isProOnly && !isPro
                        ? 'Requires Pro Subscription'
                        : `Invest $${investment.minimumInvestment}`}
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
