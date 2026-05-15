'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface BehavioralRule {
  id: string;
  name: string;
  description: string;
  type: 'invisible' | 'gamification' | 'emotional' | 'automation';
  enabled: boolean;
  intensity: number; // 1-10
  category: 'savings' | 'spending' | 'income' | 'habits';
  psychologicalPrinciple: string;
  impact: 'high' | 'medium' | 'low';
  streak: number;
  lastTriggered?: string;
}

interface UserBehavior {
  incomePattern: 'sporadic' | 'seasonal' | 'project-based' | 'mixed';
  savingMotivation: 'security' | 'goals' | 'freedom' | 'legacy';
  painPoints: string[];
  triggers: string[];
  rewards: string[];
}

const defaultRules: BehavioralRule[] = [
  {
    id: 'invisible-roundup',
    name: 'Invisible Round-Up',
    description: 'Automatically round up purchases to the nearest dollar',
    type: 'invisible',
    enabled: true,
    intensity: 7,
    category: 'savings',
    psychologicalPrinciple: 'Loss Aversion - Small amounts feel painless',
    impact: 'high',
    streak: 12,
  },
  {
    id: 'income-spike-save',
    name: 'Income Spike Saver',
    description: 'Save 20% of income above your average',
    type: 'automation',
    enabled: true,
    intensity: 8,
    category: 'income',
    psychologicalPrinciple: 'Mental Accounting - Extra money feels free',
    impact: 'high',
    streak: 5,
  },
  {
    id: 'guilty-pleasure-tax',
    name: 'Guilty Pleasure Tax',
    description: 'Save $5 every time you buy coffee or fast food',
    type: 'emotional',
    enabled: false,
    intensity: 5,
    category: 'spending',
    psychologicalPrinciple: 'Pain of Paying - Associate spending with saving',
    impact: 'medium',
    streak: 0,
  },
  {
    id: 'streak-bonus',
    name: 'Streak Bonus',
    description: 'Double savings on day 7 of consecutive saving',
    type: 'gamification',
    enabled: true,
    intensity: 6,
    category: 'habits',
    psychologicalPrinciple: 'Variable Rewards - Unpredictable bonuses',
    impact: 'medium',
    streak: 3,
  },
  {
    id: 'peace-progress',
    name: 'Peace Progress Bar',
    description: 'Visual progress bar for financial peace',
    type: 'gamification',
    enabled: true,
    intensity: 9,
    category: 'savings',
    psychologicalPrinciple: 'Progress Visualization - See your journey',
    impact: 'high',
    streak: 8,
  },
  {
    id: 'income-dip-protection',
    name: 'Income Dip Protection',
    description: 'Pause savings when income drops 30%',
    type: 'automation',
    enabled: true,
    intensity: 7,
    category: 'income',
    psychologicalPrinciple: 'Loss Prevention - Protect against setbacks',
    impact: 'high',
    streak: 2,
  },
];

export default function BehavioralFinance() {
  const { data: session } = useSession();
  const [rules, setRules] = useState<BehavioralRule[]>(defaultRules);
  const [userBehavior, setUserBehavior] = useState<UserBehavior | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const _loadBehavioralData = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const response = await fetch('/api/smart-saving/behavioral');
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || defaultRules);
      }
    } catch (error) {
      console.error('Error loading behavioral data:', error);
    }
  }, [session?.user?.email]);

  const _loadUserBehavior = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const response = await fetch('/api/user/behavior');
      if (response.ok) {
        const data = await response.json();
        setUserBehavior(data);
      }
    } catch (error) {
      console.error('Error loading user behavior:', error);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    _loadBehavioralData();
    _loadUserBehavior();
  }, [_loadBehavioralData, _loadUserBehavior]);

  const _toggleRule = async (ruleId: string) => {
    setLoading(true);
    try {
      const updatedRules = rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      );

      const response = await fetch('/api/smart-saving/behavioral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updatedRules }),
      });

      if (response.ok) {
        setRules(updatedRules);
        const rule = rules.find(r => r.id === ruleId);
        toast.success(`${rule?.enabled ? 'Disabled' : 'Enabled'} ${rule?.name}`);
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to update rule');
    } finally {
      setLoading(false);
    }
  };

  const _updateIntensity = async (ruleId: string, intensity: number) => {
    const updatedRules = rules.map(rule => (rule.id === ruleId ? { ...rule, intensity } : rule));
    setRules(updatedRules);

    // Debounce the API call
    setTimeout(async () => {
      try {
        await fetch('/api/smart-saving/behavioral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules: updatedRules }),
        });
      } catch (error) {
        console.error('Error updating intensity:', error);
      }
    }, 500);
  };

  const _getRuleIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      invisible: Icons.eyeOff,
      gamification: Icons.trophy,
      emotional: Icons.heart,
      automation: Icons.zap,
    };
    return iconMap[type] || Icons.target;
  };

  const _getImpactColor = (impact: string) => {
    const colorMap: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colorMap[impact] || 'bg-gray-100 text-gray-800';
  };

  const _getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      savings: 'bg-green-500',
      spending: 'bg-red-500',
      income: 'bg-blue-500',
      habits: 'bg-purple-500',
    };
    return colorMap[category] || 'bg-gray-500';
  };

  const activeRules = rules.filter(r => r.enabled);
  const totalImpact = activeRules.reduce((sum, rule) => sum + rule.intensity, 0);
  const averageIntensity = activeRules.length > 0 ? totalImpact / activeRules.length : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.brain className="h-5 w-5" />
          Behavioral Finance Engine
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI-powered psychological principles to make saving feel effortless and rewarding.
        </p>

        {/* Behavioral Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{activeRules.length}</div>
            <div className="text-xs text-muted-foreground">Active Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{Math.round(averageIntensity)}</div>
            <div className="text-xs text-muted-foreground">Avg Intensity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {rules.reduce((sum, r) => sum + r.streak, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Streaks</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Behavioral Rules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Psychological Rules</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          {rules.map(rule => {
            const _IconComponent = _getRuleIcon(rule.type);

            return (
              <div key={rule.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <_IconComponent className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge className={_getImpactColor(rule.impact)}>{rule.impact} impact</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                      {showAdvanced && (
                        <p className="mt-1 text-xs text-blue-600">
                          💡 {rule.psychologicalPrinciple}
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => _toggleRule(rule.id)}
                    disabled={loading}
                  />
                </div>

                {rule.enabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Intensity</span>
                      <span>{rule.intensity}/10</span>
                    </div>
                    <Slider
                      value={[rule.intensity]}
                      onValueChange={([value]) => _updateIntensity(rule.id, value)}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${_getCategoryColor(rule.category)}`} />
                    <span className="text-xs capitalize text-muted-foreground">
                      {rule.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rule.streak > 0 && (
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <Icons.flame className="h-3 w-3" />
                        <span>{rule.streak} day streak</span>
                      </div>
                    )}
                    {rule.lastTriggered && (
                      <span className="text-xs text-muted-foreground">
                        Last: {new Date(rule.lastTriggered).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Personalized Insights */}
        {userBehavior && (
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-950 dark:to-purple-950">
            <h4 className="mb-2 font-medium">🧠 Personalized for Your Behavior</h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Income Pattern:</strong> {userBehavior.incomePattern.replace('-', ' ')}
              </p>
              <p>
                <strong>Primary Motivation:</strong> {userBehavior.savingMotivation}
              </p>
              <p>
                <strong>Top Pain Point:</strong> {userBehavior.painPoints[0]}
              </p>
            </div>
          </div>
        )}

        {/* Behavioral Tips */}
        <div className="space-y-3">
          <h4 className="font-medium">💡 Behavioral Tips</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Icons.lightbulb className="mt-0.5 h-4 w-4 text-yellow-500" />
              <p>Start with invisible savings - you won&apos;t miss what you never see</p>
            </div>
            <div className="flex items-start gap-2">
              <Icons.target className="mt-0.5 h-4 w-4 text-green-500" />
              <p>Use streaks to build momentum - consistency beats perfection</p>
            </div>
            <div className="flex items-start gap-2">
              <Icons.heart className="mt-0.5 h-4 w-4 text-red-500" />
              <p>Connect savings to your values - why are you saving?</p>
            </div>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="space-y-3">
          <h4 className="font-medium">📊 Your Behavioral Progress</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Rule Engagement</span>
              <span>{Math.round((activeRules.length / rules.length) * 100)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
