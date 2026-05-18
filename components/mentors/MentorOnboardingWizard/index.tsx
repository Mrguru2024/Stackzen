'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface MentorOnboardingWizardProps {
  onComplete?: () => void;
}

export function MentorOnboardingWizard({ onComplete }: MentorOnboardingWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');

  const { isLoading } = useQuery({
    queryKey: ['mentor', 'me', 'onboarding'],
    queryFn: async () => {
      const res = await fetch('/api/mentors/me');
      const data = (await res.json()) as {
        mentor: { bio: string | null; hourlyRate: number | null } | null;
      };
      if (data.mentor?.bio) setBio(data.mentor.bio);
      if (data.mentor?.hourlyRate) setHourlyRate(String(data.mentor.hourlyRate));
      return data.mentor;
    },
  });

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/mentors/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          hourlyRate: Number(hourlyRate),
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? 'Save failed');
      }
      setStep(2);
    } catch (error) {
      toast({
        title: 'Could not save',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const goLive = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/mentors/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completeOnboarding: true }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? 'Could not complete setup');
      }
      toast({
        title: 'You are live',
        description: 'Members can now find you in the mentor directory and book sessions.',
      });
      onComplete?.();
    } catch (error) {
      toast({
        title: 'Setup incomplete',
        description: error instanceof Error ? error.message : 'Try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your profile…</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mentor setup ({step}/2)</CardTitle>
        <CardDescription>Confirm how you appear to members seeking financial guidance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="setup-bio">Public bio</Label>
              <Textarea
                id="setup-bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="How you help clients with money decisions…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setup-rate">Hourly rate (USD) for direct bookings</Label>
              <Input
                id="setup-rate"
                type="number"
                min={50}
                value={hourlyRate}
                onChange={e => setHourlyRate(e.target.value)}
              />
            </div>
            <Button onClick={() => void saveProfile()} disabled={saving || !bio.trim() || !hourlyRate}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue
            </Button>
          </>
        ) : (
          <>
            <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
              <li>Your profile will appear in the verified mentor directory.</li>
              <li>Members can book StackZen sessions ($65) or direct sessions at your rate.</li>
              <li>
                Optional: connect Stripe under{' '}
                <Link href="/settings/payments" className="font-medium text-primary underline">
                  Settings → Payments
                </Link>{' '}
                to receive payouts for client invoices (separate from mentor session payouts).
              </li>
            </ul>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => void goLive()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Go live in directory
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
