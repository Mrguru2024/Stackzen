'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Badge } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: 'high' | 'medium' | 'low';
  date: Date;
  type: 'saving' | 'investment' | 'spending' | 'income';
}

interface FinancialInsightsProps {
  insights?: Insight[];
  onInsightClick?: (insight: Insight) => void;
}

export default function FinancialInsights({
  insights = [],
  onInsightClick,
}: FinancialInsightsProps) {
  const [selectedTab, setSelectedTab] = useState<string>('all');

  const filteredInsights =
    selectedTab === 'all' ? insights : insights.filter(insight => insight.type === selectedTab);

  const getImpactColor = (impact: Insight['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: Insight['type']) => {
    switch (type) {
      case 'saving':
        return '💰';
      case 'investment':
        return '📈';
      case 'spending':
        return '💸';
      case 'income':
        return '💵';
      default:
        return '📊';
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Financial Insights</h2>
      </div>

      <Tabs defaultValue="all" onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="saving">Savings</TabsTrigger>
          <TabsTrigger value="investment">Investments</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInsights.map(insight => (
              <Card
                key={insight.id}
                className="cursor-pointer p-4 transition-shadow hover:shadow-lg"
                onClick={() => onInsightClick?.(insight)}
              >
                <div className="mb-2 flex items-start gap-2">
                  <span className="text-2xl">{getTypeIcon(insight.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <div className="mt-1 flex gap-2">
                      <Badge className={`${getImpactColor(insight.impact)} capitalize text-white`}>
                        {insight.impact} impact
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {insight.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="mb-2 text-sm text-gray-600">{insight.description}</p>
                <p className="text-sm text-gray-500">
                  {new Date(insight.date).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
