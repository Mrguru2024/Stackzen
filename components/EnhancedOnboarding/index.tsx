'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui';

interface OnboardingData {
  // Income Data
  monthlyIncome: number;
  incomeSources: Array<{
    name: string;
    amount: number;
    frequency: 'monthly' | 'weekly' | 'biweekly' | 'annually';
  }>;
  incomeStability: number; // months

  // Debt Data
  totalDebt: number;
  monthlyDebtPayments: number;
  debtTypes: Array<{
    name: string;
    amount: number;
    monthlyPayment: number;
    interestRate: number;
  }>;

  // Savings Data
  totalSavings: number;
  monthlySavingsGoal: number;
  emergencyFundMonths: number;

  // Goals
  financialGoals: Array<{
    name: string;
    target: number;
    deadline: string;
    category: string;
  }>;

  // Personal Data
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  financialLiteracy: 'beginner' | 'intermediate' | 'advanced';
  lifeStage: 'student' | 'early_career' | 'mid_career' | 'late_career' | 'retirement';
  familySize: number;
  location: string;

  // Investment Preferences
  investmentExperience: 'none' | 'beginner' | 'intermediate' | 'advanced';
  preferredInvestmentTypes: string[];
}

const EnhancedOnboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    monthlyIncome: 0,
    incomeSources: [{ name: '', amount: 0, frequency: 'monthly' }],
    incomeStability: 12,
    totalDebt: 0,
    monthlyDebtPayments: 0,
    debtTypes: [],
    totalSavings: 0,
    monthlySavingsGoal: 0,
    emergencyFundMonths: 3,
    financialGoals: [],
    riskTolerance: 'moderate',
    financialLiteracy: 'beginner',
    lifeStage: 'early_career',
    familySize: 1,
    location: '',
    investmentExperience: 'none',
    preferredInvestmentTypes: [],
  });

  const router = useRouter();

  const steps = ['income', 'debt', 'savings', 'goals', 'personal', 'investment', 'complete'];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/onboarding/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        throw new Error('Failed to save onboarding data');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to save onboarding data. Please try again.');
    }
  };

  const renderStep = () => {
    switch (steps[step]) {
      case 'income':
        return (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Income Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Monthly Income</Label>
                <Input
                  type="number"
                  value={data.monthlyIncome}
                  onChange={e => setData({ ...data, monthlyIncome: Number(e.target.value) })}
                  placeholder="Enter your monthly income"
                />
              </div>
              <div>
                <Label>Income Stability (months)</Label>
                <Select
                  value={data.incomeStability.toString()}
                  onValueChange={value => setData({ ...data, incomeStability: Number(value) })}
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
            </CardContent>
          </Card>
        );

      case 'debt':
        return (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Debt Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Total Debt</Label>
                <Input
                  type="number"
                  value={data.totalDebt}
                  onChange={e => setData({ ...data, totalDebt: Number(e.target.value) })}
                  placeholder="Enter your total debt"
                />
              </div>
              <div>
                <Label>Monthly Debt Payments</Label>
                <Input
                  type="number"
                  value={data.monthlyDebtPayments}
                  onChange={e => setData({ ...data, monthlyDebtPayments: Number(e.target.value) })}
                  placeholder="Enter your monthly debt payments"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'savings':
        return (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Savings Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Total Savings</Label>
                <Input
                  type="number"
                  value={data.totalSavings}
                  onChange={e => setData({ ...data, totalSavings: Number(e.target.value) })}
                  placeholder="Enter your total savings"
                />
              </div>
              <div>
                <Label>Monthly Savings Goal</Label>
                <Input
                  type="number"
                  value={data.monthlySavingsGoal}
                  onChange={e => setData({ ...data, monthlySavingsGoal: Number(e.target.value) })}
                  placeholder="Enter your monthly savings goal"
                />
              </div>
              <div>
                <Label>Emergency Fund (months of expenses)</Label>
                <Select
                  value={data.emergencyFundMonths.toString()}
                  onValueChange={value => setData({ ...data, emergencyFundMonths: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 month</SelectItem>
                    <SelectItem value="2">2 months</SelectItem>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 'goals':
        return (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Financial Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Primary Financial Goal</Label>
                <Input
                  value={data.financialGoals[0]?.name || ''}
                  onChange={e =>
                    setData({
                      ...data,
                      financialGoals: [
                        { name: e.target.value, target: 0, deadline: '', category: 'primary' },
                      ],
                    })
                  }
                  placeholder="e.g., Buy a house, Save for retirement"
                />
              </div>
              <div>
                <Label>Target Amount</Label>
                <Input
                  type="number"
                  value={data.financialGoals[0]?.target || 0}
                  onChange={e =>
                    setData({
                      ...data,
                      financialGoals: [
                        { ...data.financialGoals[0], target: Number(e.target.value) },
                      ],
                    })
                  }
                  placeholder="Enter target amount"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'personal':
        return (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Risk Tolerance</Label>
                <Select
                  value={data.riskTolerance}
                  onValueChange={value => setData({ ...data, riskTolerance: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Financial Literacy Level</Label>
                <Select
                  value={data.financialLiteracy}
                  onValueChange={value => setData({ ...data, financialLiteracy: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Life Stage</Label>
                <Select
                  value={data.lifeStage}
                  onValueChange={value => setData({ ...data, lifeStage: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="early_career">Early Career</SelectItem>
                    <SelectItem value="mid_career">Mid Career</SelectItem>
                    <SelectItem value="late_career">Late Career</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Family Size</Label>
                <Input
                  type="number"
                  value={data.familySize}
                  onChange={e => setData({ ...data, familySize: Number(e.target.value) })}
                  min="1"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={data.location}
                  onChange={e => setData({ ...data, location: e.target.value })}
                  placeholder="City, State"
                />
              </div>
            </CardContent>
          </Card>
        );

      case 'investment':
        return (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Investment Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Investment Experience</Label>
                <Select
                  value={data.investmentExperience}
                  onValueChange={value => setData({ ...data, investmentExperience: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No experience</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 'complete':
        return (
          <Card className="mx-auto w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Onboarding Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Thank you for providing your financial information. We'll use this data to
                personalize your experience and provide better recommendations.
              </p>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 font-semibold">Summary:</h3>
                <ul className="space-y-1 text-sm">
                  <li>Monthly Income: ${data.monthlyIncome.toLocaleString()}</li>
                  <li>Total Debt: ${data.totalDebt.toLocaleString()}</li>
                  <li>Total Savings: ${data.totalSavings.toLocaleString()}</li>
                  <li>Risk Tolerance: {data.riskTolerance}</li>
                  <li>Life Stage: {data.lifeStage.replace('_', ' ')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium">
              Step {step + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((step + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            Back
          </Button>

          {step === steps.length - 1 ? (
            <Button onClick={handleSubmit} size="lg">
              Complete Setup
            </Button>
          ) : (
            <Button onClick={handleNext} size="lg">
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedOnboarding;
