'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

export interface AiPreferenceSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  goalReminders: boolean;
}

interface Props {
  initialSettings: AiPreferenceSettings;
}

const PREF_LABELS: Record<keyof AiPreferenceSettings, string> = {
  emailNotifications: 'AI email notifications',
  pushNotifications: 'AI push notifications',
  weeklyReports: 'Weekly AI summary reports',
  goalReminders: 'AI goal reminders',
};

export function AiPersonalizationControls({ initialSettings }: Props) {
  const [settings, setSettings] = useState<AiPreferenceSettings>(initialSettings);
  const [saving, setSaving] = useState(false);

  const update = async (key: keyof AiPreferenceSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        throw new Error('Failed to save preference');
      }
      toast.success('Preference saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save preference');
      setSettings(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-900">
      <p className="mb-4 text-sm text-muted-foreground">
        Control how StackZen&apos;s AI features reach you. Toggles persist immediately to your
        account settings.
      </p>
      <div className="space-y-4">
        {(Object.keys(PREF_LABELS) as Array<keyof AiPreferenceSettings>).map(key => (
          <div key={key} className="flex items-center justify-between">
            <span className="font-medium dark:text-white">{PREF_LABELS[key]}</span>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={e => update(key, e.target.checked)}
                disabled={saving}
                className="form-checkbox h-5 w-5 rounded text-primary focus:ring-primary"
                aria-label={PREF_LABELS[key]}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
