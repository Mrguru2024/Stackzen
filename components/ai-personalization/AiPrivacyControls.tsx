'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

type PrivacyState = {
  aiConsentAt: string | null;
  aiMemoryEnabled: boolean;
  aiOptOut: boolean;
};

export function AiPrivacyControls() {
  const [privacy, setPrivacy] = useState<PrivacyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/consent', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load AI privacy settings');
      const data = (await res.json()) as PrivacyState;
      setPrivacy(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load AI settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grantConsent = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/ai/consent', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to grant consent');
      toast.success('AI consent saved');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Consent failed');
    } finally {
      setSaving(false);
    }
  };

  const patchSettings = async (body: Record<string, boolean>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Failed to save settings');
      }
      toast.success('AI settings updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const clearMemory = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/ai/memory', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Failed to clear AI memory');
      toast.success('AI chat memory cleared');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Clear failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading AI privacy settings…</p>;
  }

  const hasConsent = Boolean(privacy?.aiConsentAt);

  return (
    <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">AI privacy & consent</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        StackZen AI provides educational guidance only — not personalized investment, tax, or legal
        advice. You control consent, memory, and opt-out.
      </p>

      {!hasConsent ? (
        <Button type="button" onClick={grantConsent} disabled={saving}>
          Enable StackZen AI
        </Button>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Consent granted{' '}
            {privacy?.aiConsentAt ? new Date(privacy.aiConsentAt).toLocaleString() : ''}
          </p>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="ai-memory" className="flex-1 cursor-pointer">
              Save chat memory
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Store conversation history for Money Mentor (encrypted when enabled server-side).
              </span>
            </Label>
            <Switch
              id="ai-memory"
              checked={privacy?.aiMemoryEnabled ?? false}
              disabled={saving || privacy?.aiOptOut}
              onCheckedChange={v => patchSettings({ aiMemoryEnabled: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="ai-opt-out" className="flex-1 cursor-pointer">
              Opt out of all AI features
            </Label>
            <Switch
              id="ai-opt-out"
              checked={privacy?.aiOptOut ?? false}
              disabled={saving}
              onCheckedChange={v => patchSettings({ aiOptOut: v })}
            />
          </div>
          <Button type="button" variant="outline" onClick={clearMemory} disabled={saving}>
            Clear AI memory
          </Button>
        </div>
      )}
    </div>
  );
}
