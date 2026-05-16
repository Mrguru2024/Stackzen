'use client';

import React from 'react';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSavingsChallenges } from '@/hooks/useSavingsChallenges';
import {
  Trophy,
  Target,
  Calendar,
  DollarSign,
  Users,
  Share2,
  Plus,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Challenge {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  startDate: Date;
  endDate: Date;
  participants: number;
  type: 'personal' | 'group';
  category: 'emergency' | 'vacation' | 'education' | 'home' | 'other';
}

type NewChallengeDraft = Omit<Challenge, 'id' | 'currentAmount' | 'participants' | 'status' | 'startDate' | 'endDate'> & {
  startDate: string;
  endDate: string;
};

export default function SavingsChallenges() {
  const { challenges, loading, error, createChallenge, updateProgress, joinChallenge } =
    useSavingsChallenges();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newChallenge, setNewChallenge] = useState<NewChallengeDraft>({
    title: '',
    description: '',
    targetAmount: 0,
    startDate: '',
    endDate: '',
    type: 'personal',
    category: 'other',
  });

  const _calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const _getCategoryIcon = (category: Challenge['category']) => {
    switch (category) {
      case 'emergency':
        return <Target className="h-5 w-5" />;
      case 'vacation':
        return <Calendar className="h-5 w-5" />;
      case 'education':
        return <Trophy className="h-5 w-5" />;
      case 'home':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createChallenge({
      ...newChallenge,
      startDate: new Date(newChallenge.startDate),
      endDate: new Date(newChallenge.endDate),
    });
    if (success) {
      setIsCreating(false);
      setNewChallenge({
        title: '',
        description: '',
        targetAmount: 0,
        startDate: '',
        endDate: '',
        type: 'personal',
        category: 'other',
      });
    }
  };

  const handleUpdateProgress = async (challengeId: string, amount: number) => {
    await updateProgress(challengeId, amount);
  };

  const handleJoinChallenge = async (challengeId: string) => {
    await joinChallenge(challengeId);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Challenges</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Challenge
        </button>
      </div>

      {isCreating && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-semibold">Create New Challenge</h3>
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1 block text-sm font-medium">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={newChallenge.title}
                  onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Enter challenge title"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newChallenge.description}
                  onChange={e =>
                    setNewChallenge({
                      ...newChallenge,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  rows={3}
                  placeholder="Describe your savings challenge"
                  required
                />
              </div>
              <div>
                <label htmlFor="targetAmount" className="mb-1 block text-sm font-medium">
                  Target Amount
                </label>
                <input
                  id="targetAmount"
                  type="number"
                  value={newChallenge.targetAmount}
                  onChange={e =>
                    setNewChallenge({
                      ...newChallenge,
                      targetAmount: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                  min="0"
                  placeholder="Enter target amount"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={newChallenge.startDate}
                    onChange={e =>
                      setNewChallenge({
                        ...newChallenge,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="mb-1 block text-sm font-medium">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={newChallenge.endDate}
                    onChange={e =>
                      setNewChallenge({
                        ...newChallenge,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="mb-1 block text-sm font-medium">
                    Type
                  </label>
                  <select
                    id="type"
                    value={newChallenge.type}
                    onChange={e =>
                      setNewChallenge({
                        ...newChallenge,
                        type: e.target.value as 'personal' | 'group',
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    aria-label="Challenge type"
                  >
                    <option value="personal">Personal</option>
                    <option value="group">Group</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="category" className="mb-1 block text-sm font-medium">
                    Category
                  </label>
                  <select
                    id="category"
                    value={newChallenge.category}
                    onChange={e =>
                      setNewChallenge({
                        ...newChallenge,
                        category: e.target.value as
                          | 'emergency'
                          | 'vacation'
                          | 'education'
                          | 'home'
                          | 'other',
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    aria-label="Challenge category"
                  >
                    <option value="emergency">Emergency Fund</option>
                    <option value="vacation">Vacation</option>
                    <option value="education">Education</option>
                    <option value="home">Home</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
                >
                  Create Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map(challenge => (
          <div
            key={challenge.id}
            className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:bg-gray-800"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {challenge.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{challenge.description}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  challenge.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : challenge.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {challenge.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Target className="mr-2 h-4 w-4" />
                <span>Target: {formatCurrency(challenge.targetAmount)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <TrendingUp className="mr-2 h-4 w-4" />
                <span>
                  Progress: {formatCurrency(challenge.currentAmount)} /{' '}
                  {formatCurrency(challenge.targetAmount)}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Users className="mr-2 h-4 w-4" />
                <span>{challenge.participants} participants</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Calendar className="mr-2 h-4 w-4" />
                <span>
                  {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                </span>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${(challenge.currentAmount / challenge.targetAmount) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              {challenge.type === 'group' && (
                <button
                  onClick={() => handleJoinChallenge(challenge.id)}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
                >
                  Join Challenge
                </button>
              )}
              <button
                onClick={() => handleUpdateProgress(challenge.id, challenge.currentAmount + 100)}
                className="flex-1 rounded-lg border border-primary px-4 py-2 text-primary hover:bg-primary/10"
              >
                Update Progress
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
