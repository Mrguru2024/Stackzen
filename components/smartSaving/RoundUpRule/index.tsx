'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Switch } from '@/components/ui';
import { Icons } from '@/components/ui/icons';

interface RoundUpConfig {
  enabled: boolean;
  goalId?: string;
  maxAmount?: number;
}

interface RoundUpRuleProps {
  onUpdate?: () => void;
}

export default function RoundUpRule({ onUpdate }: RoundUpRuleProps) {
  const [config, setConfig] = useState<RoundUpConfig>({
    enabled: false,
    maxAmount: 5,
  });
  const [loading, setLoading] = useState(false);
  const [totalRoundUps, setTotalRoundUps] = useState(0);

  useEffect(() => {
    fetchRoundUpData();
  }, []);

  const fetchRoundUpData = async () => {
    try {
      const response = await fetch('/api/smart-saving/rules');
      if (response.ok) {
        const rules = await response.json();
        const roundUpRule = rules.find((rule: any) => rule.type === 'roundup');
        if (roundUpRule) {
          setConfig(roundUpRule.config);
        }
      }

      // Fetch round-up executions
      const summaryResponse = await fetch('/api/smart-saving/summary');
      if (summaryResponse.ok) {
        const summary = await summaryResponse.json();
        const roundUpAmount = summary.weeklySummary?.ruleBreakdown?.roundup || 0;
        setTotalRoundUps(roundUpAmount);
      }
    } catch (error) {
      console.error('Error fetching round-up data:', error);
    }
  };

  const toggleRoundUp = async () => {
    setLoading(true);
    try {
      const newConfig = { ...config, enabled: !config.enabled };

      const response = await fetch('/api/smart-saving/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Zen Round-Up',
          type: 'roundup',
          config: newConfig,
        }),
      });

      if (response.ok) {
        setConfig(newConfig);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error updating round-up rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulateRoundUp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/smart-saving/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'roundup',
          amount: 3.75, // Simulate a $3.75 purchase
          description: 'Coffee purchase',
        }),
      });

      if (response.ok) {
        fetchRoundUpData();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error executing round-up:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Icons.creditCard className="h-5 w-5 text-blue-600" />
          Zen Round-Up Rule
        </CardTitle>
        <Switch checked={config.enabled} onCheckedChange={toggleRoundUp} disabled={loading} />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Automatically round up your purchases and save the difference.
        </p>

        <div className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-zinc-800">
          <div>
            <div className="text-sm font-medium">This Week&apos;s Round-Ups</div>
            <div className="text-2xl font-bold text-blue-600">${totalRoundUps.toFixed(2)}</div>
          </div>
          <Icons.trendingUp className="h-8 w-8 text-blue-600" />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={simulateRoundUp}
            disabled={loading || !config.enabled}
            className="flex-1"
          >
            {loading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.plus className="mr-2 h-4 w-4" />
            )}
            Simulate Round-Up
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Max round-up per transaction: ${config.maxAmount || 5}
        </div>

        <span>It&apos;s a smart way to save!</span>
      </CardContent>
    </Card>
  );
}
