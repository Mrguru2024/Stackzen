import React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertConfig, defaultAlertConfig } from '@/lib/utils/performance-alerts';
import { toast } from 'sonner';

interface AlertSettingsProps {
  onConfigChange: (config: AlertConfig) => void;
  initialConfig?: AlertConfig;
}

export function AlertSettings({
  onConfigChange,
  initialConfig = defaultAlertConfig,
}: AlertSettingsProps) {
  const [config, setConfig] = useState<AlertConfig>(initialConfig);
  const [isEnabled, setIsEnabled] = useState(true);

  const handleThresholdChange = (
    metric: keyof AlertConfig,
    type: 'warning' | 'error',
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const newConfig = {
      ...config,
      [metric]: {
        ...config[metric],
        [type]: numValue,
      },
    };

    setConfig(newConfig);
    onConfigChange(newConfig);
    toast.success('Alert thresholds updated');
  };

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    if (!checked) {
      toast.info('Performance alerts disabled');
    } else {
      toast.success('Performance alerts enabled');
    }
  };

  const handleReset = () => {
    setConfig(defaultAlertConfig);
    onConfigChange(defaultAlertConfig);
    toast.success('Alert thresholds reset to defaults');
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Alert Settings</h3>
          <p className="text-sm text-muted-foreground">Configure performance alert thresholds</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={isEnabled} onCheckedChange={handleToggle} id="alerts-enabled" />
            <Label htmlFor="alerts-enabled">Enable Alerts</Label>
          </div>
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Object.entries(config).map(([metric, thresholds]) => (
          <div key={metric} className="space-y-4">
            <h4 className="font-medium capitalize">
              {metric.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${metric}-warning`}>Warning</Label>
                <Input
                  id={`${metric}-warning`}
                  type="number"
                  value={thresholds.warning}
                  onChange={e =>
                    handleThresholdChange(metric as keyof AlertConfig, 'warning', e.target.value)
                  }
                  disabled={!isEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${metric}-error`}>Error</Label>
                <Input
                  id={`${metric}-error`}
                  type="number"
                  value={thresholds.error}
                  onChange={e =>
                    handleThresholdChange(metric as keyof AlertConfig, 'error', e.target.value)
                  }
                  disabled={!isEnabled}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
