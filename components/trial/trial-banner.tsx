'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  trialExpiresAt: Date | null;
  trialStartedAt: Date | null;
  isExpired: boolean;
}

interface TrialBannerProps {
  className?: string;
}

export function TrialBanner({ className = '' }: TrialBannerProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    _fetchTrialStatus();
  }, []);

  const _fetchTrialStatus = async () => {
    try {
      const _response = await fetch('/api/trial/status', { credentials: 'include' });
      if (_response.status === 401) {
        // Not logged in, hide the banner
        setTrialStatus(null);
        setIsLoading(false);
        return;
      }
      if (_response.ok) {
        const data = await _response.json();
        setTrialStatus(data.trialStatus);
      }
    } catch (error) {
      console.error('Failed to fetch trial status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const _handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const _response = await fetch('/api/trial/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (_response.ok) {
        const data = await _response.json();
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

  if (isLoading) {
    return (
      <div className={`animate-pulse rounded-lg bg-gray-100 p-4 dark:bg-gray-800 ${className}`}>
        <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="h-3 w-1/2 rounded bg-gray-200"></div>
      </div>
    );
  }

  if (!trialStatus) {
    return null;
  }

  // If user has a paid subscription, don't show trial banner
  if (!trialStatus.isActive && !trialStatus.isExpired) {
    return null;
  }

  // Calculate trial progress
  const totalDays = 14;
  const daysUsed = totalDays - trialStatus.daysRemaining;
  const progress = Math.max(0, Math.min(100, (daysUsed / totalDays) * 100));

  if (trialStatus.isExpired) {
    return (
      <div
        className={`rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:bg-red-950/20 ${className}`}
      >
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600">
            <span className="text-xs text-white">!</span>
          </div>
          <h3 className="font-semibold text-red-700 dark:text-red-300">Trial Expired</h3>
        </div>
        <p className="mb-4 text-red-600 dark:text-red-400">
          Your 14-day trial has expired. Upgrade to continue accessing all features.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={_handleUpgrade}
            disabled={isUpgrading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isUpgrading ? 'Processing...' : 'Upgrade Now - $6.99/month'}
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/pricing')}>
            View All Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:bg-blue-950/20 ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
          <span className="text-xs text-white">⏰</span>
        </div>
        <h3 className="font-semibold text-blue-700 dark:text-blue-300">Free Trial</h3>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Trial Progress</span>
            <span>{trialStatus.daysRemaining} days remaining</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <p className="text-sm text-blue-600 dark:text-blue-400">
          You have {trialStatus.daysRemaining} days left in your free trial. Upgrade to continue
          accessing all features after your trial ends.
        </p>

        <div className="flex gap-2">
          <Button
            onClick={_handleUpgrade}
            disabled={isUpgrading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUpgrading ? 'Processing...' : 'Upgrade Now - $6.99/month'}
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/pricing')}>
            View All Plans
          </Button>
        </div>

        {trialStatus.daysRemaining <= 3 && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-600">
              <span className="text-xs text-white">!</span>
            </span>
            <span>Trial ending soon! Upgrade to avoid losing access to your data.</span>
          </div>
        )}
      </div>
    </div>
  );
}
