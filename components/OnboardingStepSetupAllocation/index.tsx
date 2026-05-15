'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingStepSetupAllocationProps {
  onNext: (allocation: { needs: number; wants: number; savings: number }) => void;
}

export function OnboardingStepSetupAllocation({ onNext }: OnboardingStepSetupAllocationProps) {
  const [needs, setNeeds] = React.useState(50);
  const [wants, setWants] = React.useState(30);
  const [savings, setSavings] = React.useState(20);

  const _handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ needs, wants, savings });
  };

  return (
    <Card className="p-6">
      <h2 className="mb-6 text-2xl font-bold">Setup Your Allocation</h2>
      <form onSubmit={_handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="needs">Needs (%)</Label>
            <Input
              id="needs"
              type="number"
              min="0"
              max="100"
              value={needs}
              onChange={e => setNeeds(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="wants">Wants (%)</Label>
            <Input
              id="wants"
              type="number"
              min="0"
              max="100"
              value={wants}
              onChange={e => setWants(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="savings">Savings (%)</Label>
            <Input
              id="savings"
              type="number"
              min="0"
              max="100"
              value={savings}
              onChange={e => setSavings(Number(e.target.value))}
            />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </Card>
  );
}

export default OnboardingStepSetupAllocation;
