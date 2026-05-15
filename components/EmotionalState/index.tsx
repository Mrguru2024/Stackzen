'use client';

import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';

const _moodOptions = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😌', label: 'Calm', value: 'calm' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
  { emoji: '😟', label: 'Worried', value: 'worried' },
  { emoji: '😰', label: 'Stressed', value: 'stressed' },
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
];

const _supportiveMessages = {
  happy: [
    "You're in a great mood! Perfect time to review your financial goals. 🎯",
    'Your positive energy is contagious! Keep up the great work with your finances! ✨',
  ],
  calm: [
    'You seem centered and focused. Great state of mind for making financial decisions. 🧘‍♀️',
    "Your calm approach to money is admirable. You're building healthy habits! 🌱",
  ],
  neutral: [
    'A neutral mood is perfect for reviewing your finances objectively. 📊',
    'Sometimes the best financial decisions come from a balanced state of mind. ⚖️',
  ],
  worried: [
    "It's okay to feel worried about money. Let's break this down into manageable steps. 🤝",
    "Remember, you're not alone in this. We're here to help you feel more confident. 💪",
  ],
  stressed: [
    "Financial stress is real and valid. Let's take a deep breath and tackle this together. 🌬️",
    "When you're stressed, focus on what you can control. Small steps lead to big changes. 🚶‍♀️",
  ],
  frustrated: [
    "Frustration is a sign you care about your financial future. That's actually a good thing! 🔥",
    "Let's channel that frustration into positive action. You've got this! 💪",
  ],
};

export default function EmotionalState() {
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [showMoodCheck, setShowMoodCheck] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  const _handleMoodSelect = (mood: string) => {
    setCurrentMood(mood);
    setShowMoodCheck(false);
    setMessageIndex(
      Math.floor(
        Math.random() * _supportiveMessages[mood as keyof typeof _supportiveMessages].length
      )
    );
  };

  const _getRandomMessage = () => {
    if (!currentMood) return '';
    const _messages = _supportiveMessages[currentMood as keyof typeof _supportiveMessages];
    return _messages[Math.floor(Math.random() * _messages.length)];
  };

  if (showMoodCheck) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-700 dark:from-purple-900 dark:to-pink-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💭</span>
            <span className="text-gray-900 dark:text-white">How are you feeling today?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Understanding your mood helps us provide better financial guidance.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {_moodOptions.map(mood => (
              <Button
                key={mood.value}
                variant="outline"
                className="flex h-20 flex-col gap-1 hover:bg-purple-100 dark:hover:bg-purple-800"
                onClick={() => _handleMoodSelect(mood.value)}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="text-xs">{mood.label}</span>
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            className="mt-3 text-gray-500 dark:text-gray-400"
            onClick={() => setShowMoodCheck(false)}
          >
            Skip for now
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (currentMood) {
    const _selectedMood = _moodOptions.find(m => m.value === currentMood);
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-700 dark:from-blue-900 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <span className="text-2xl">{_selectedMood?.emoji}</span>
            Financial Wellness Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-center">
            <p className="mb-2 text-lg text-gray-700 dark:text-gray-200">{_getRandomMessage()}</p>
            <Badge variant="outline" className="text-sm dark:bg-blue-800 dark:text-blue-100">
              {_selectedMood?.label} Mood
            </Badge>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full dark:border-blue-700 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
              onClick={() =>
                setMessageIndex(
                  prev =>
                    (prev + 1) %
                    _supportiveMessages[currentMood as keyof typeof _supportiveMessages].length
                )
              }
            >
              Get Another Message
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-500 dark:text-gray-400 dark:hover:bg-blue-800"
              onClick={() => setShowMoodCheck(true)}
            >
              Change My Mood
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Wellness</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShowMoodCheck(true)} className="w-full">
          Check In With Your Mood
        </Button>
      </CardContent>
    </Card>
  );
}
