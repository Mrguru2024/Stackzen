'use client';

import React from 'react';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import Progress from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Shield,
  PieChart,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface PortfolioAsset {
  id: string;
  name: string;
  type: string;
  amount: number;
  value: number;
  return: number;
  allocation: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

interface PortfolioMetric {
  totalValue: number;
  totalReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
  riskScore: number;
  diversificationScore: number;
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const isPro = user?.subscription?.status === 'active';

  const { data: assets, isLoading: assetsLoading } = useQuery<PortfolioAsset[]>({
    queryKey: ['/api/portfolio/assets'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/assets');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio assets');
      }
      return response.json();
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<PortfolioMetric>({
    queryKey: ['/api/portfolio/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/portfolio/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio metrics');
      }
      return response.json();
    },
  });

  const getReturnColor = (returnValue: number) => {
    return returnValue >= 0 ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="container mx-auto space-y-8 py-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Portfolio</h1>
          <p className="text-muted-foreground">Track your investments and monitor performance</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(metrics?.totalValue ?? 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Current portfolio value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${getReturnColor(metrics?.totalReturn ?? 0)}`}
            >
              {(metrics?.totalReturn ?? 0) >= 0 ? '+' : ''}
              {(metrics?.totalReturn ?? 0).toFixed(2)}%
            </div>
            <p className="text-sm text-muted-foreground">Overall return</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.riskScore || 0}/100</div>
            <p className="text-sm text-muted-foreground">Portfolio risk level</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-6">
          {activeTab === 'overview' ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Allocation</CardTitle>
                  <CardDescription>Distribution of your investments</CardDescription>
                </CardHeader>
                <CardContent>
                  {assetsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assets?.map(asset => (
                        <div key={asset.id}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="text-muted-foreground">{asset.name}</span>
                            <span className="font-medium">{asset.allocation}%</span>
                          </div>
                          <Progress value={asset.allocation} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Monthly Return</span>
                        <span
                          className={`font-medium ${getReturnColor(metrics?.monthlyReturn ?? 0)}`}
                        >
                          {(metrics?.monthlyReturn ?? 0) >= 0 ? '+' : ''}
                          {(metrics?.monthlyReturn ?? 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Yearly Return</span>
                        <span
                          className={`font-medium ${getReturnColor(metrics?.yearlyReturn ?? 0)}`}
                        >
                          {(metrics?.yearlyReturn ?? 0) >= 0 ? '+' : ''}
                          {(metrics?.yearlyReturn ?? 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Diversification</span>
                        <span className="font-medium">{metrics?.diversificationScore ?? 0}/100</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : activeTab === 'assets' ? (
            assetsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {assets?.map(asset => (
                  <Card key={asset.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{asset.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${
                            asset.riskLevel === 'low'
                              ? 'text-green-500'
                              : asset.riskLevel === 'high'
                                ? 'text-red-500'
                                : 'text-yellow-500'
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {asset.riskLevel} risk
                        </Badge>
                      </div>
                      <CardDescription>{asset.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Value</div>
                            <div className="text-lg font-medium">
                              ${asset.value.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Return</div>
                            <div className={`text-lg font-medium ${getReturnColor(asset.return)}`}>
                              {asset.return >= 0 ? '+' : ''}
                              {asset.return.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{asset.allocation}% allocation</Badge>
                          </div>
                          <span>Updated {new Date(asset.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                  <CardDescription>Last 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Add chart component here */}
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    Performance chart will be displayed here
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Asset Performance</CardTitle>
                  <CardDescription>Individual asset returns</CardDescription>
                </CardHeader>
                <CardContent>
                  {assetsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assets?.map(asset => (
                        <div key={asset.id} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{asset.name}</span>
                          <span className={`font-medium ${getReturnColor(asset.return)}`}>
                            {asset.return >= 0 ? '+' : ''}
                            {asset.return.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
