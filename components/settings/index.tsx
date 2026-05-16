import React from 'react';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Settings() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/api/auth/signin');
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Settings</h1>
      <div className="space-y-6 rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <div>
          <h2 className="mb-2 font-semibold dark:text-white">Profile</h2>
          <div className="flex flex-col gap-2">
            <span className="text-gray-700 dark:text-gray-300">Name: {user?.name}</span>
            <span className="text-gray-700 dark:text-gray-300">Email: {user?.email}</span>
          </div>
        </div>
        <div>
          <h2 className="mb-2 font-semibold dark:text-white">Preferences</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300">Theme:</span>
            {/* Theme toggle would go here */}
            <span className="italic text-gray-400">(Theme toggle coming soon)</span>
          </div>
        </div>
        <div>
          <h2 className="mb-2 font-semibold dark:text-white">AI Features</h2>
          <div className="flex items-center gap-4">
            <label htmlFor="ai-optout" className="text-gray-700 dark:text-gray-300">
              Opt out of AI features:
            </label>
            <input
              id="ai-optout"
              type="checkbox"
              checked={false}
              readOnly
              title="AI opt-out preference is not stored on the user model yet"
              className="form-checkbox h-5 w-5 text-primary"
            />
            <span className="text-sm text-gray-500">(Change coming soon)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
