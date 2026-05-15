'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, Slider, Switch } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface SmartBucket {
  id: string;
  name: string;
  type: 'emergency' | 'tax' | 'goals' | 'fun' | 'tools' | 'treat' | 'custom';
  percentage: number;
  color: string;
  icon: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface IncomeSplitConfig {
  enabled: boolean;
  buckets: SmartBucket[];
  irregularIncomeMode: boolean;
  spikeThreshold: number;
  dipThreshold: number;
  autoAdjust: boolean;
}

const defaultBuckets: SmartBucket[] = [
  {
    id: 'emergency',
    name: 'Emergency Fund',
    type: 'emergency',
    percentage: 15,
    color: 'bg-red-500',
    icon: 'shield',
    description: 'For unexpected expenses and income gaps',
    priority: 'high',
  },
  {
    id: 'tax',
    name: 'Tax Buffer',
    type: 'tax',
    percentage: 25,
    color: 'bg-blue-500',
    icon: 'calculator',
    description: 'Quarterly tax payments and deductions',
    priority: 'high',
  },
  {
    id: 'goals',
    name: 'Goals & Dreams',
    type: 'goals',
    percentage: 20,
    color: 'bg-green-500',
    icon: 'target',
    description: 'Long-term savings and investments',
    priority: 'medium',
  },
  {
    id: 'tools',
    name: 'Tools & Equipment',
    type: 'tools',
    percentage: 10,
    color: 'bg-purple-500',
    icon: 'wrench',
    description: 'Business tools and professional development',
    priority: 'medium',
  },
  {
    id: 'fun',
    name: 'Fun Money',
    type: 'fun',
    percentage: 15,
    color: 'bg-yellow-500',
    icon: 'smile',
    description: 'Rewards and entertainment',
    priority: 'low',
  },
  {
    id: 'treat',
    name: 'Treat Yourself',
    type: 'treat',
    percentage: 15,
    color: 'bg-pink-500',
    icon: 'gift',
    description: 'Special rewards and milestones',
    priority: 'low',
  },
];

export default function EnhancedIncomeSplit() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<IncomeSplitConfig>({
    enabled: false,
    buckets: defaultBuckets,
    irregularIncomeMode: true,
    spikeThreshold: 50,
    dipThreshold: 30,
    autoAdjust: true,
  });
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const _loadConfig = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const response = await fetch('/api/smart-saving/income-split');
      if (response.ok) {
        const data = await response.json();
        setConfig(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading income split config:', error);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    _loadConfig();
  }, [_loadConfig]);

  const _saveConfig = async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    try {
      const response = await fetch('/api/smart-saving/income-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Income split configuration saved!');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const _updateBucketPercentage = (bucketId: string, percentage: number) => {
    setConfig(prev => ({
      ...prev,
      buckets: prev.buckets.map(bucket =>
        bucket.id === bucketId ? { ...bucket, percentage } : bucket
      ),
    }));
  };

  const _getTotalPercentage = () => {
    return config.buckets.reduce((sum, bucket) => sum + bucket.percentage, 0);
  };

  const _getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      shield: Icons.shield,
      calculator: Icons.calculator,
      target: Icons.target,
      wrench: Icons.wrench,
      smile: Icons.smile,
      gift: Icons.gift,
      piggyBank: Icons.piggyBank,
      trendingUp: Icons.trendingUp,
    };
    return iconMap[iconName] || Icons.piggyBank;
  };

  const _totalPercentage = _getTotalPercentage();
  const _isValid = _totalPercentage === 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.trendingUp className="h-5 w-5" />
          Zen Income Splitter
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatically split irregular income into smart buckets. Perfect for freelancers, gig
          workers, and tradespeople.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enable-split">Enable Income Splitting</Label>
            <p className="text-sm text-muted-foreground">
              Automatically allocate income when received
            </p>
          </div>
          <Switch
            id="enable-split"
            checked={config.enabled}
            onCheckedChange={checked => setConfig(prev => ({ ...prev, enabled: checked }))}
          />
        </div>

        {/* Irregular Income Mode */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="irregular-mode">Irregular Income Mode</Label>
            <p className="text-sm text-muted-foreground">Optimize for variable income patterns</p>
          </div>
          <Switch
            id="irregular-mode"
            checked={config.irregularIncomeMode}
            onCheckedChange={checked =>
              setConfig(prev => ({ ...prev, irregularIncomeMode: checked }))
            }
          />
        </div>

        {/* Bucket Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Smart Buckets</h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${_isValid ? 'text-green-600' : 'text-red-600'}`}>
                {_totalPercentage}%
              </span>
              {!_isValid && <span className="text-xs text-red-600">Must equal 100%</span>}
            </div>
          </div>

          <div className="space-y-3">
            {config.buckets.map(bucket => {
              const _IconComponent = _getIconComponent(bucket.icon);
              return (
                <div key={bucket.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${bucket.color}`} />
                      <_IconComponent className="h-4 w-4" />
                      <span className="font-medium">{bucket.name}</span>
                      <span className="text-xs text-muted-foreground">{bucket.description}</span>
                    </div>
                    <span className="text-sm font-medium">{bucket.percentage}%</span>
                  </div>
                  <Slider
                    value={[bucket.percentage]}
                    onValueChange={([value]) => _updateBucketPercentage(bucket.id, value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full">
            {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
          </Button>

          {showAdvanced && (
            <div className="space-y-4 rounded-lg bg-muted p-4">
              <div className="space-y-2">
                <Label htmlFor="spike-threshold">Income Spike Threshold (%)</Label>
                <Input
                  id="spike-threshold"
                  type="number"
                  value={config.spikeThreshold}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      spikeThreshold: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">
                  Automatically save extra when income increases by this percentage
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dip-threshold">Income Dip Threshold (%)</Label>
                <Input
                  id="dip-threshold"
                  type="number"
                  value={config.dipThreshold}
                  onChange={e =>
                    setConfig(prev => ({
                      ...prev,
                      dipThreshold: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Pause savings when income decreases by this percentage
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-adjust">Auto-Adjust Percentages</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically adjust based on income patterns
                  </p>
                </div>
                <Switch
                  id="auto-adjust"
                  checked={config.autoAdjust}
                  onCheckedChange={checked => setConfig(prev => ({ ...prev, autoAdjust: checked }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={_saveConfig} disabled={loading || !_isValid} className="flex-1">
            {loading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>

          <Button variant="outline" onClick={_loadConfig} disabled={loading}>
            Reset
          </Button>
        </div>

        {/* Status Indicator */}
        {config.enabled && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Income splitting is active and monitoring for deposits
          </div>
        )}
      </CardContent>
    </Card>
  );
}
