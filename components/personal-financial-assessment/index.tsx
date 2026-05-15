import React from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type PersonalFinancialAssessmentProps = Record<string, never>;

interface AssessmentItem {
  id: string;
  text: string;
  answer: string;
  rating: 'strength' | 'risk' | 'neutral';
}

const NEUTRAL_LABEL = 'Not provided yet';

function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return NEUTRAL_LABEL;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function rateAmount(value: number | null | undefined, lowerIsBetter: boolean, threshold: number) {
  if (value == null) return 'neutral' as const;
  if (lowerIsBetter) {
    return value <= threshold ? 'strength' : 'risk';
  }
  return value >= threshold ? 'strength' : 'risk';
}

function rateRiskTolerance(value: string | null | undefined) {
  if (!value) return 'neutral' as const;
  const v = value.toLowerCase();
  if (v.includes('high')) return 'risk';
  if (v.includes('moderate') || v.includes('medium')) return 'strength';
  return 'neutral';
}

export default async function PersonalFinancialAssessment({}: PersonalFinancialAssessmentProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fassessment');
  }

  const userId = session.user.id;
  const onboarding = await prisma.userOnboardingData.findUnique({
    where: { userId },
  });

  const items: AssessmentItem[] = onboarding
    ? [
        {
          id: 'emergency-fund',
          text: 'Emergency fund',
          answer: formatCurrency(onboarding.emergencyFund),
          rating: rateAmount(onboarding.emergencyFund, false, 1000),
        },
        {
          id: 'monthly-expenses',
          text: 'Monthly expenses',
          answer: formatCurrency(onboarding.monthlyExpenses),
          rating: rateAmount(onboarding.monthlyExpenses, true, 5000),
        },
        {
          id: 'discretionary-spending',
          text: 'Discretionary spending',
          answer: formatCurrency(onboarding.discretionarySpending),
          rating: rateAmount(onboarding.discretionarySpending, true, 1000),
        },
        {
          id: 'retirement-savings',
          text: 'Retirement savings',
          answer: formatCurrency(onboarding.retirementSavings),
          rating: rateAmount(onboarding.retirementSavings, false, 1),
        },
        {
          id: 'investment-accounts',
          text: 'Investment accounts',
          answer: formatCurrency(onboarding.investmentAccounts),
          rating: rateAmount(onboarding.investmentAccounts, false, 1),
        },
        {
          id: 'total-debt',
          text: 'Total debt',
          answer: formatCurrency(onboarding.totalDebt),
          rating: rateAmount(onboarding.totalDebt, true, 0),
        },
        {
          id: 'saving-rate',
          text: 'Saving rate',
          answer:
            onboarding.savingRate != null ? `${onboarding.savingRate.toFixed(1)}%` : NEUTRAL_LABEL,
          rating: rateAmount(onboarding.savingRate, false, 15),
        },
        {
          id: 'risk-tolerance',
          text: 'Risk tolerance',
          answer: onboarding.riskTolerance ?? NEUTRAL_LABEL,
          rating: rateRiskTolerance(onboarding.riskTolerance),
        },
        {
          id: 'investment-experience',
          text: 'Investment experience',
          answer: onboarding.investmentExperience ?? NEUTRAL_LABEL,
          rating: onboarding.investmentExperience ? 'strength' : 'neutral',
        },
        {
          id: 'financial-literacy',
          text: 'Self-rated financial literacy',
          answer: onboarding.financialLiteracy ?? NEUTRAL_LABEL,
          rating: onboarding.financialLiteracy ? 'strength' : 'neutral',
        },
      ]
    : [];

  const strengths = items.filter(i => i.rating === 'strength');
  const risks = items.filter(i => i.rating === 'risk');

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Personal Financial Assessment</h1>
      <div className="mb-8">
        <h2 className="mb-2 text-lg font-semibold dark:text-white">Your Profile</h2>
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed bg-card p-6 text-sm text-muted-foreground">
            You haven&apos;t completed onboarding yet. Finish the onboarding flow to populate your
            assessment.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map(item => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-900"
              >
                <span className="font-medium dark:text-white">{item.text}</span>
                <span className="text-sm text-muted-foreground">{item.answer}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
          <h3 className="mb-2 font-semibold dark:text-white">Strengths</h3>
          <ul className="list-inside list-disc text-green-600 dark:text-green-400">
            {strengths.length > 0 ? (
              strengths.map(s => <li key={s.id}>{s.text}</li>)
            ) : (
              <li className="text-muted-foreground">None yet</li>
            )}
          </ul>
        </div>
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
          <h3 className="mb-2 font-semibold dark:text-white">Risks</h3>
          <ul className="list-inside list-disc text-red-600 dark:text-red-400">
            {risks.length > 0 ? (
              risks.map(r => <li key={r.id}>{r.text}</li>)
            ) : (
              <li className="text-muted-foreground">None detected</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
