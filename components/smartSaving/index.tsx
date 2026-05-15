'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  useSavingsRulesRealtime,
  useSavingsExecutionsRealtime,
  useSmartBucketsRealtime,
} from '@/hooks/useSupabaseRealtime';
import SmartSavingDashboard from './SmartSavingDashboard';
import RoundUpRule from './RoundUpRule';
import AutoSaverForm from './AutoSaverForm';
import BudgetCategorySetup from './BudgetCategorySetup';
import TriggerSaveForm from './TriggerSaveForm';
import IncomeSplitConfig from './IncomeSplitConfig/EnhancedIncomeSplit';
import ZenMissions from './ZenMissions/EnhancedZenMissions';
import ZenInvestPortal from './ZenInvestPortal';
import WeeklyZenSummary from './WeeklyZenSummary';
import BehavioralFinance from './BehavioralFinance';
import RealTimeTest from './RealTimeTest';

interface SmartSavingSummary {
  weeklySummary: {
    totalSaved: number;
    ruleBreakdown: Record<string, number>;
    executionCount: number;
    averagePerDay: number;
  };
  bucketStatus: any[];
  activeRules: number;
  totalBuckets: number;
  totalSaved: number;
  databaseType?: string;
  behavioralInsights?: {
    activeRules: number;
    averageIntensity: number;
    behaviorType: string;
    recommendations: string[];
  };
}

export default function SmartSavingMain() {
  const [summary, setSummary] = useState<SmartSavingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRealTimeTest, setShowRealTimeTest] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'behavioral' | 'missions' | 'advanced'>(
    'overview'
  );

  // Real-time hooks
  const { rules: realtimeRules, loading: rulesLoading } = useSavingsRulesRealtime();
  const { executions: realtimeExecutions, loading: executionsLoading } =
    useSavingsExecutionsRealtime(5);
  const { buckets: realtimeBuckets, loading: bucketsLoading } = useSmartBucketsRealtime();

  useEffect(() => {
    fetchSummary();
  }, []);

  // Update summary when real-time data changes
  useEffect(() => {
    if (realtimeRules && realtimeExecutions && realtimeBuckets) {
      updateSummaryFromRealtimeData();
    }
  }, [realtimeRules, realtimeExecutions, realtimeBuckets]);

  // Real spike/dip detection is owned by the savings rule engine and surfaces via
  // operational notifications + the BehavioralFinance panel. No client-side
  // simulation is performed here.

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/smart-saving/summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      } else {
        setError('Failed to fetch smart saving data');
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setError('Failed to load smart saving dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateSummaryFromRealtimeData = () => {
    if (!realtimeRules || !realtimeExecutions || !realtimeBuckets) return;

    const totalSaved = realtimeExecutions.reduce((sum, exec) => sum + exec.amount, 0);
    const ruleBreakdown = realtimeExecutions.reduce(
      (acc, exec) => {
        const ruleType = exec.metadata?.ruleType || 'unknown';
        acc[ruleType] = (acc[ruleType] || 0) + exec.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const weeklySummary = {
      totalSaved,
      ruleBreakdown,
      executionCount: realtimeExecutions.length,
      averagePerDay: totalSaved / 7,
    };

    setSummary(prev => ({
      ...prev!,
      weeklySummary,
      bucketStatus: realtimeBuckets,
      activeRules: realtimeRules.filter(rule => rule.is_active).length,
      totalBuckets: realtimeBuckets.length,
      totalSaved,
    }));
  };

  const handleUpdate = () => {
    fetchSummary();
  };

  if (loading || rulesLoading || executionsLoading || bucketsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <Icons.warning className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchSummary}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      {/* Header with Summary Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-8 pt-6">
          <div>
            <h1 className="text-3xl font-bold">Smart Saving</h1>
            <p className="text-muted-foreground">
              AI-powered behavioral finance for irregular income users
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {summary?.databaseType && (
              <div className="text-sm text-muted-foreground">Using: {summary.databaseType}</div>
            )}
            <button
              onClick={() => setShowRealTimeTest(!showRealTimeTest)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showRealTimeTest ? 'Hide' : 'Show'} Real-time Test
            </button>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
                <Icons.trendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary.totalSaved.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                <Icons.target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.activeRules}</div>
                <p className="text-xs text-muted-foreground">Running automations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Smart Buckets</CardTitle>
                <Icons.piggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalBuckets}</div>
                <p className="text-xs text-muted-foreground">Organized savings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                <Icons.arrowUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${summary.weeklySummary.averagePerDay.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Per day this week</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center gap-2 text-sm text-green-600">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
        Live updates enabled
      </div>

      {/* Real-time Test Component */}
      {showRealTimeTest && <RealTimeTest />}

      {/* Tab Navigation */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        {[
          { id: 'overview', label: 'Overview', icon: Icons.home },
          { id: 'behavioral', label: 'Behavioral', icon: Icons.brain },
          { id: 'missions', label: 'Missions', icon: Icons.target },
          { id: 'advanced', label: 'Advanced', icon: Icons.settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <IncomeSplitConfig />
          <BehavioralFinance />
          <ZenMissions />
          <SmartSavingDashboard />
          <WeeklyZenSummary />
          <ZenInvestPortal />
        </div>
      )}

      {activeTab === 'behavioral' && (
        <div className="space-y-6">
          <BehavioralFinance />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <RoundUpRule onUpdate={handleUpdate} />
            <TriggerSaveForm />
          </div>
        </div>
      )}

      {activeTab === 'missions' && (
        <div className="space-y-6">
          <ZenMissions />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <AutoSaverForm />
            <BudgetCategorySetup />
          </div>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RoundUpRule onUpdate={handleUpdate} />
          <AutoSaverForm />
          <BudgetCategorySetup />
          <TriggerSaveForm />
          <IncomeSplitConfig />
          <SmartSavingDashboard />
        </div>
      )}
    </div>
  );
}
