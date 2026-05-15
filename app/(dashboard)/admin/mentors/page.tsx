import React from 'react';
import { Metadata } from 'next';
import AdminMentorManagement from '@/components/admin/AdminMentorManagement';

export const metadata: Metadata = {
  title: 'Admin - Mentor Management',
  description: 'Manage mentors, approve applications, and monitor performance.',
};

export default function AdminMentorsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentor Management</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Review mentor applications, manage certifications, and monitor platform performance.
        </p>
      </div>

      <AdminMentorManagement />
    </div>
  );
}
