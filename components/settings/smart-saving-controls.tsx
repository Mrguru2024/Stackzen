'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Icons } from '@/components/ui/icons';

interface SavingsRule {
  id: string;
  name: string;
  type: string;
  config: any;
  isActive: boolean;
}

export default function SmartSavingControls() {
  const [rules, setRules] = useState<SavingsRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/smart-saving/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        toast.error('Failed to load savings rules');
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load savings rules');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (type: string, enabled: boolean) => {
    try {
      const rule = rules.find(r => r.type === type);
      const config = { ...rule?.config, enabled };

      const response = await fetch('/api/smart-saving/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rule?.name || type,
          type,
          config,
        }),
      });

      if (response.ok) {
        await fetchRules();
        toast.success(`${type} rule ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        toast.error('Failed to update rule');
      }
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const getRuleDisplayName = (type: string) => {
    const names: Record<string, string> = {
      roundup: 'Round-Up Rule',
      auto: 'Auto-Saver',
      budget: 'Budget Saver',
      trigger: 'Trigger Save',
      income_split: 'Income Splitter',
      spike_dip: 'Spike/Dip Automation',
    };
    return names[type] || type;
  };

  const getRuleDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      roundup: 'Automatically round up purchases and save the difference',
      auto: 'Set up recurring automatic savings',
      budget: 'Save surplus from budget categories',
      trigger: 'Save when spending on specific items',
      income_split: 'Automatically split income into buckets',
      spike_dip: 'Automatically save extra when income spikes, or pause savings on dips',
    };
    return descriptions[type] || '';
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Smart Saving Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Icons.spinner className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icons.target className="h-5 w-5" />
          Smart Saving Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {['roundup', 'auto', 'budget', 'trigger', 'income_split', 'spike_dip'].map(type => {
            const rule = rules.find(r => r.type === type);
            const isEnabled = rule?.config?.enabled || false;

            return (
              <div key={type} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{getRuleDisplayName(type)}</h3>
                    <p className="text-sm text-muted-foreground">{getRuleDescription(type)}</p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={checked => handleToggle(type, checked)}
                  />
                </div>

                {isEnabled && (
                  <div className="mt-4 space-y-3">
                    {type === 'roundup' && (
                      <div>
                        <Label htmlFor="maxAmount">Max Round-Up Amount</Label>
                        <Input
                          id="maxAmount"
                          type="number"
                          value={rule?.config?.maxAmount || 5}
                          onChange={() => {
                            // const _newConfig = { ...rule.config, maxAmount: Number(e.target.value) };
                            handleToggle(type, true);
                          }}
                          className="mt-1"
                        />
                      </div>
                    )}

                    {type === 'auto' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="autoAmount">Amount</Label>
                          <Input
                            id="autoAmount"
                            type="number"
                            value={rule?.config?.amount || 10}
                            onChange={() => {
                              // const _newConfig = { ...rule.config, amount: Number(e.target.value) };
                              handleToggle(type, true);
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="frequency">Frequency</Label>
                          <select
                            id="frequency"
                            value={rule?.config?.frequency || 'weekly'}
                            onChange={() => {
                              // const _newConfig = { ...rule.config, frequency: e.target.value };
                              handleToggle(type, true);
                            }}
                            className="mt-1 w-full rounded-md border px-3 py-2"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {type === 'trigger' && (
                      <div>
                        <Label>Trigger Keywords</Label>
                        <div className="mt-2 space-y-2">
                          {(rule?.config?.triggers || []).map((trigger: any, index: number) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder="Keyword (e.g., coffee)"
                                value={trigger.keyword}
                                onChange={() => {
                                  // const newTriggers = [...(rule.config.triggers || [])];
                                  // newTriggers[index] = { ...trigger, keyword: e.target.value };
                                  // const _newConfig = { ...rule.config, triggers: newTriggers };
                                  handleToggle(type, true);
                                }}
                              />
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={trigger.amount}
                                onChange={() => {
                                  // const newTriggers = [...(rule.config.triggers || [])];
                                  // newTriggers[index] = {
                                  //   ...trigger,
                                  //   amount: Number(e.target.value),
                                  // };
                                  // const _newConfig = { ...rule.config, triggers: newTriggers };
                                  handleToggle(type, true);
                                }}
                                className="w-24"
                              />
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // const newTriggers = [
                              //   ...(rule.config.triggers || []),
                              //   { keyword: '', amount: 5 },
                              // ];
                              // const _newConfig = { ...rule.config, triggers: newTriggers };
                              handleToggle(type, true);
                            }}
                          >
                            Add Trigger
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
