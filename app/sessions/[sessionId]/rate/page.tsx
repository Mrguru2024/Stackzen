import React from 'react';
import { Metadata } from 'next';
import SessionRatingForm from '@/components/mentors/SessionRating/SessionRatingForm';

export const metadata: Metadata = {
  title: 'Rate Your Session - StackZen',
  description: 'Share your feedback about your mentor session.',
};

interface RateSessionPageProps {
  params: { sessionId: string };
}

export default function RateSessionPage({ params }: RateSessionPageProps) {
  const { sessionId } = params;

  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Rate Your Session
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your feedback helps us improve and helps other users find great mentors.
          </p>
        </div>

        <SessionRatingForm
          sessionId={sessionId}
          mentorName="Your Mentor"
          onRatingSubmitted={() => {
            // Handle rating submission
          }}
        />
      </div>
    </div>
  );
}
