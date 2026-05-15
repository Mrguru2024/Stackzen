'use client';

import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui';

export default function TrialExpiredPage() {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/trial/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create upgrade session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start upgrade process. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const features = [
    'Track your income and expenses',
    'Set and monitor financial goals',
    'Access detailed analytics and reports',
    'Use smart budgeting tools',
    'Export your data anytime',
    'Priority customer support',
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 dark:bg-red-950/20">
          <div className="pb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
                <span className="text-lg text-white">🔒</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-red-700 dark:text-red-300">Trial Expired</h1>
            <p className="mt-2 text-red-600 dark:text-red-400">
              Your 14-day free trial has ended. Upgrade to continue accessing all features.
            </p>
          </div>

          <div className="space-y-6">
            {/* What you'll get */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                What you&apos;ll get with StackZen Starter:
              </h3>
              <div className="grid gap-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600">
                      <span className="text-xs text-white">✓</span>
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-lg border bg-white p-4 dark:bg-gray-800">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  $6.99
                  <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                    /month
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Cancel anytime • No setup fees
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                size="lg"
              >
                {isUpgrading ? (
                  'Processing...'
                ) : (
                  <>
                    Upgrade Now
                    <span className="ml-2">→</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/pricing')}
                className="flex-1"
                size="lg"
              >
                View All Plans
              </Button>
            </div>

            {/* Additional info */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>Your data is safe and will be restored once you upgrade. No data will be lost.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
