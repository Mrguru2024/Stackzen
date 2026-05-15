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

interface DebtItem {
  name: string;
  amount: number;
  monthlyPayment: number;
  interestRate: number;
  type: 'credit_card' | 'student_loan' | 'mortgage' | 'car_loan' | 'personal_loan' | 'other';
}

interface OnboardingStepSetupDebtSavingsProps {
  onNext: (data: {
    debtData: {
      totalDebt: number;
      monthlyPayments: number;
      monthlyIncome: number;
      debts: DebtItem[];
    };
    savingsData: {
      rate: number;
      totalSavings: number;
      monthlyIncome: number;
    };
    emergencyFund: {
      months: number;
    };
  }) => void;
  monthlyIncome: number;
}

const OnboardingStepSetupDebtSavings: React.FC<OnboardingStepSetupDebtSavingsProps> = ({
  onNext,
  monthlyIncome,
}) => {
  const [debts, setDebts] = useState<DebtItem[]>([
    { name: '', amount: 0, monthlyPayment: 0, interestRate: 0, type: 'credit_card' },
  ]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [emergencyFundMonths, setEmergencyFundMonths] = useState(3);

  const addDebt = () => {
    setDebts([
      ...debts,
      { name: '', amount: 0, monthlyPayment: 0, interestRate: 0, type: 'credit_card' },
    ]);
  };

  const removeDebt = (index: number) => {
    if (debts.length > 1) {
      setDebts(debts.filter((_, i) => i !== index));
    }
  };

  const updateDebt = (index: number, field: keyof DebtItem, value: string | number) => {
    const newDebts = [...debts];
    newDebts[index] = { ...newDebts[index], [field]: value };
    setDebts(newDebts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate debts
    const validDebts = debts.filter(debt => debt.name && debt.amount > 0);

    const totalDebt = validDebts.reduce((sum, debt) => sum + debt.amount, 0);
    const totalMonthlyPayments = validDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);

    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    onNext({
      debtData: {
        totalDebt,
        monthlyPayments: totalMonthlyPayments,
        monthlyIncome,
        debts: validDebts,
      },
      savingsData: {
        rate: savingsRate,
        totalSavings,
        monthlyIncome,
      },
      emergencyFund: {
        months: emergencyFundMonths,
      },
    });
  };

  const totalMonthlyPayments = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  const debtToIncomeRatio = monthlyIncome > 0 ? (totalMonthlyPayments / monthlyIncome) * 100 : 0;

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">Debt & Savings Setup</CardTitle>
        <p className="text-center text-gray-600">
          Let&apos;s understand your current debt situation and savings goals
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Debt Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Current Debts</Label>
            {debts.map((debt, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-5"
              >
                <div>
                  <Label htmlFor={`debt-name-${index}`}>Debt Name</Label>
                  <Input
                    id={`debt-name-${index}`}
                    value={debt.name}
                    onChange={e => updateDebt(index, 'name', e.target.value)}
                    placeholder="e.g., Credit Card, Student Loan"
                  />
                </div>
                <div>
                  <Label htmlFor={`debt-amount-${index}`}>Balance</Label>
                  <Input
                    id={`debt-amount-${index}`}
                    type="number"
                    value={debt.amount}
                    onChange={e => updateDebt(index, 'amount', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor={`debt-payment-${index}`}>Monthly Payment</Label>
                  <Input
                    id={`debt-payment-${index}`}
                    type="number"
                    value={debt.monthlyPayment}
                    onChange={e => updateDebt(index, 'monthlyPayment', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor={`debt-rate-${index}`}>Interest Rate (%)</Label>
                  <Input
                    id={`debt-rate-${index}`}
                    type="number"
                    value={debt.interestRate}
                    onChange={e => updateDebt(index, 'interestRate', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeDebt(index)}
                    disabled={debts.length === 1}
                    className="w-full"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addDebt} className="w-full">
              + Add Another Debt
            </Button>
          </div>

          {/* Savings Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Savings Information</Label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="total-savings">Total Current Savings</Label>
                <Input
                  id="total-savings"
                  type="number"
                  value={totalSavings}
                  onChange={e => setTotalSavings(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="monthly-savings">Monthly Savings Goal</Label>
                <Input
                  id="monthly-savings"
                  type="number"
                  value={monthlySavings}
                  onChange={e => setMonthlySavings(Number(e.target.value))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Emergency Fund */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Emergency Fund</Label>
            <div>
              <Label htmlFor="emergency-fund-months">
                How many months of expenses do you want in your emergency fund?
              </Label>
              <Select
                value={emergencyFundMonths.toString()}
                onValueChange={value => setEmergencyFundMonths(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 month</SelectItem>
                  <SelectItem value="2">2 months</SelectItem>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="4">4 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <h3 className="font-semibold">Summary</h3>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div>
                <p>
                  Total Debt: ${debts.reduce((sum, debt) => sum + debt.amount, 0).toLocaleString()}
                </p>
                <p>Monthly Debt Payments: ${totalMonthlyPayments.toLocaleString()}</p>
                <p>Debt-to-Income Ratio: {debtToIncomeRatio.toFixed(1)}%</p>
              </div>
              <div>
                <p>Total Savings: ${totalSavings.toLocaleString()}</p>
                <p>Monthly Savings: ${monthlySavings.toLocaleString()}</p>
                <p>
                  Savings Rate:{' '}
                  {monthlyIncome > 0 ? ((monthlySavings / monthlyIncome) * 100).toFixed(1) : 0}%
                </p>
              </div>
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

export default OnboardingStepSetupDebtSavings;
