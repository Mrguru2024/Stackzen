import React from 'react';
import { Metadata } from 'next';
import MentorApplicationForm from '@/components/mentors/MentorApplicationForm';

export const metadata: Metadata = {
  title: 'Become a Mentor - StackZen',
  description:
    'Apply to become a certified financial mentor and help others achieve their financial goals.',
};

export default function BecomeMentorPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Become a StackZen Mentor
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Share your financial expertise and help others achieve their financial goals. Join our
          community of certified mentors and earn while making a difference.
        </p>
      </div>

      <MentorApplicationForm />
    </div>
  );
}
