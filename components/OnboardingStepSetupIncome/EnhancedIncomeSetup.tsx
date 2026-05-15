'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IncomeSource {
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'biweekly' | 'annually';
}

interface OnboardingStepSetupIncomeProps {
  onNext: (incomeData: {
    sources: IncomeSource[];
    allocation: {
      needs: number;
      savings: number;
      investments: number;
      needsTarget: number;
      savingsTarget: number;
      investmentsTarget: number;
    };
    monthsWithIncome: number;
  }) => void;
}

const OnboardingStepSetupIncome: React.FC<OnboardingStepSetupIncomeProps> = ({ onNext }) => {
  const [sources, setSources] = useState<IncomeSource[]>([
    { name: '', amount: 0, frequency: 'monthly' },
  ]);
  const [allocation, setAllocation] = useState({
    needs: 40,
    savings: 30,
    investments: 30,
    needsTarget: 40,
    savingsTarget: 30,
    investmentsTarget: 30,
  });
  const [monthsWithIncome, setMonthsWithIncome] = useState(12);

  const addSource = () => {
    setSources([...sources, { name: '', amount: 0, frequency: 'monthly' }]);
  };

  const removeSource = (index: number) => {
    if (sources.length > 1) {
      setSources(sources.filter((_, i) => i !== index));
    }
  };

  const updateSource = (index: number, field: keyof IncomeSource, value: string | number) => {
    const newSources = [...sources];
    newSources[index] = { ...newSources[index], [field]: value };
    setSources(newSources);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate sources
    const validSources = sources.filter(source => source.name && source.amount > 0);

    if (validSources.length === 0) {
      alert('Please add at least one income source');
      return;
    }

    onNext({
      sources: validSources,
      allocation,
      monthsWithIncome,
    });
  };

  const totalMonthlyIncome = sources.reduce((total, source) => {
    let monthlyAmount = source.amount;
    switch (source.frequency) {
      case 'weekly':
        monthlyAmount = source.amount * 4.33;
        break;
      case 'biweekly':
        monthlyAmount = source.amount * 2.17;
        break;
      case 'annually':
        monthlyAmount = source.amount / 12;
        break;
    }
    return total + monthlyAmount;
  }, 0);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Income Setup</CardTitle>
        <p className="text-center text-gray-600">
          Let&apos;s understand your income sources and how you&apos;d like to allocate your money
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Income Sources */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Income Sources</Label>
            {sources.map((source, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-4"
              >
                <div>
                  <Label htmlFor={`source-name-${index}`}>Source Name</Label>
                  <Input
                    id={`source-name-${index}`}
                    value={source.name}
                    onChange={e => updateSource(index, 'name', e.target.value)}
                    placeholder="e.g., Main Job, Freelance"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`source-amount-${index}`}>Amount</Label>
                  <Input
                    id={`source-amount-${index}`}
                    type="number"
                    value={source.amount}
                    onChange={e => updateSource(index, 'amount', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`source-frequency-${index}`}>Frequency</Label>
                  <Select
                    value={source.frequency}
                    onValueChange={value => updateSource(index, 'frequency', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeSource(index)}
                    disabled={sources.length === 1}
                    className="w-full"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addSource} className="w-full">
              + Add Another Income Source
            </Button>
          </div>

          {/* Income Stability */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Income Stability</Label>
            <div>
              <Label htmlFor="months-with-income">
                How many months have you had consistent income?
              </Label>
              <Select
                value={monthsWithIncome.toString()}
                onValueChange={value => setMonthsWithIncome(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1-3 months</SelectItem>
                  <SelectItem value="6">4-6 months</SelectItem>
                  <SelectItem value="12">7-12 months</SelectItem>
                  <SelectItem value="24">1-2 years</SelectItem>
                  <SelectItem value="60">2+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Allocation Preferences */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Income Allocation Preferences</Label>
            <p className="text-sm text-gray-600">
              How would you like to allocate your monthly income? (Total should equal 100%)
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="needs-target">Needs (%)</Label>
                <Input
                  id="needs-target"
                  type="number"
                  value={allocation.needsTarget}
                  onChange={e =>
                    setAllocation({
                      ...allocation,
                      needsTarget: Number(e.target.value),
                      savingsTarget: 100 - Number(e.target.value) - allocation.investmentsTarget,
                    })
                  }
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="savings-target">Savings (%)</Label>
                <Input
                  id="savings-target"
                  type="number"
                  value={allocation.savingsTarget}
                  onChange={e =>
                    setAllocation({
                      ...allocation,
                      savingsTarget: Number(e.target.value),
                      investmentsTarget: 100 - allocation.needsTarget - Number(e.target.value),
                    })
                  }
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="investments-target">Investments (%)</Label>
                <Input
                  id="investments-target"
                  type="number"
                  value={allocation.investmentsTarget}
                  onChange={e =>
                    setAllocation({
                      ...allocation,
                      investmentsTarget: Number(e.target.value),
                      savingsTarget: 100 - allocation.needsTarget - Number(e.target.value),
                    })
                  }
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Total:{' '}
                {allocation.needsTarget + allocation.savingsTarget + allocation.investmentsTarget}%
                {allocation.needsTarget +
                  allocation.savingsTarget +
                  allocation.investmentsTarget !==
                  100 && <span className="ml-2 text-red-500">(Should equal 100%)</span>}
              </p>
              <p className="mt-2 text-lg font-semibold">
                Estimated Monthly Income: ${totalMonthlyIncome.toFixed(2)}
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OnboardingStepSetupIncome;
