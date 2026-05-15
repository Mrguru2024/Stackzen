'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

type IncomeProfileType =
  | 'PAYCHECK'
  | 'CONTRACTOR'
  | 'FREELANCE'
  | 'GIG'
  | 'SIDE_HUSTLE'
  | 'BUSINESS'
  | 'COMMISSION'
  | 'PASSIVE'
  | 'OTHER';

const profileOptions: Array<{ type: IncomeProfileType; label: string }> = [
  { type: 'PAYCHECK', label: '9-to-5 paycheck' },
  { type: 'CONTRACTOR', label: 'Service business / contractor work' },
  { type: 'FREELANCE', label: 'Freelance / client work' },
  { type: 'GIG', label: 'Gig app income' },
  { type: 'SIDE_HUSTLE', label: 'Cash jobs / side hustles' },
  { type: 'BUSINESS', label: 'Online business / ecommerce' },
  { type: 'COMMISSION', label: 'Commission-based income' },
  { type: 'PASSIVE', label: 'Rental/passive income' },
  { type: 'OTHER', label: 'Other' },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [selected, setSelected] = useState<IncomeProfileType[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  useEffect(() => {
    let mounted = true;
    const loadProfiles = async () => {
      try {
        const res = await fetch('/api/income-profiles', { method: 'GET' });
        if (!res.ok) return;
        const data = (await res.json()) as { profiles?: IncomeProfileType[] };
        if (mounted && Array.isArray(data.profiles)) {
          setSelected(data.profiles);
        }
      } catch {
        // Ignore initial load failures and allow manual selection.
      }
    };
    void loadProfiles();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleSelection = (type: IncomeProfileType) => {
    setSelected(prev => {
      if (prev.includes(type)) return prev.filter(item => item !== type);
      return [...prev, type];
    });
  };

  const saveProfiles = async () => {
    if (selected.length === 0) {
      setError('Select at least one income type to continue.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/income-profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles: selected }),
      });
      if (!response.ok) {
        setError('Unable to save your income profile right now.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Unable to save your income profile right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <section className="rounded-2xl border bg-background p-5 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Onboarding
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          What types of income do you currently manage?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select all that apply. StackZen will adapt workflows, navigation, and recommendations to
          your income mix.
        </p>

        <div className="mt-6 grid gap-3">
          {profileOptions.map(option => (
            <label
              key={option.type}
              className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition hover:bg-muted/30"
            >
              <Checkbox
                checked={selectedSet.has(option.type)}
                onCheckedChange={() => toggleSelection(option.type)}
                className="mt-0.5"
              />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>

        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

        <div className="mt-6 flex items-center justify-end">
          <Button onClick={saveProfiles} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </section>
    </main>
  );
}
