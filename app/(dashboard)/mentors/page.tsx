import React from 'react';
import { Metadata } from 'next';
import MentorDirectory from '@/components/mentors/MentorDirectory';

export const metadata: Metadata = {
  title: 'StackZen Mentors - Find Your Financial Coach',
  description: 'Connect with certified financial mentors for personalized guidance and support.',
};

export default function MentorsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          StackZen Financial Mentors
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Get personalized financial guidance from certified experts. Choose from our StackZen
          Certified sessions or book directly with mentors for deeper, customized support.
        </p>
      </div>

      <MentorDirectory />
    </div>
  );
}
