'use client';

import React from 'react';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Brain, TrendingUp, TrendingDown, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Badge, Progress } from '@/components/ui';

interface MarketInsight {
  id: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  category: string;
  timestamp: string;
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  potentialReturn: number;
  timeframe: string;
  category: string;
}

export default function AIAnalysisPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('insights');
  const isPro = user?.subscription?.status === 'active';

  const { data: insights, isLoading: insightsLoading } = useQuery<MarketInsight[]>({
    queryKey: ['/api/market-insights'],
    queryFn: async () => {
      const response = await fetch('/api/market-insights');
      if (!response.ok) {
        throw new Error('Failed to fetch market insights');
      }
      return response.json();
    },
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<AIRecommendation[]>(
    {
      queryKey: ['/api/ai-recommendations'],
      queryFn: async () => {
        const response = await fetch('/api/ai-recommendations');
        if (!response.ok) {
          throw new Error('Failed to fetch AI recommendations');
        }
        return response.json();
      },
    }
  );

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto space-y-8 py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Market Analysis</h1>
          <p className="text-muted-foreground">
            Real-time market insights and AI-powered investment recommendations
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {insights?.filter(i => i.impact === 'positive').length || 0}/{insights?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Positive insights</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {recommendations?.length
                ? Math.round(
                    recommendations.reduce((sum, r) => sum + r.confidence, 0) /
                      recommendations.length
                  )
                : 0}
              %
            </div>
            <p className="text-sm text-muted-foreground">Average confidence score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {recommendations?.filter(r => r.riskLevel === 'low').length || 0}/
              {recommendations?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Low-risk recommendations</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="insights">Market Insights</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-6">
          {activeTab === 'insights' ? (
            insightsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {insights?.map(insight => (
                  <Card key={insight.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{insight.title}</CardTitle>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${
                            insight.impact === 'positive'
                              ? 'text-green-500'
                              : insight.impact === 'negative'
                                ? 'text-red-500'
                                : 'text-blue-500'
                          }`}
                        >
                          {getImpactIcon(insight.impact)}
                          {insight.impact}
                        </Badge>
                      </div>
                      <CardDescription>{insight.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-medium">{insight.confidence}%</span>
                          </div>
                          <Progress value={insight.confidence} className="h-2" />
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <Badge variant="secondary">{insight.category}</Badge>
                          <span>{new Date(insight.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : recommendationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {recommendations?.map(recommendation => (
                <Card key={recommendation.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{recommendation.title}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${
                          recommendation.riskLevel === 'low'
                            ? 'text-green-500'
                            : recommendation.riskLevel === 'high'
                              ? 'text-red-500'
                              : 'text-yellow-500'
                        }`}
                      >
                        {recommendation.riskLevel === 'high' ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <Shield className="h-3 w-3" />
                        )}
                        {recommendation.riskLevel} risk
                      </Badge>
                    </div>
                    <CardDescription>{recommendation.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className="font-medium">{recommendation.confidence}%</span>
                        </div>
                        <Progress value={recommendation.confidence} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{recommendation.category}</Badge>
                          <span>{recommendation.timeframe}</span>
                        </div>
                        <span className="font-medium text-green-500">
                          +{recommendation.potentialReturn}% potential
                        </span>
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
