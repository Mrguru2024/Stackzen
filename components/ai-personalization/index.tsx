import React from 'react';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import { canPersistAiMemory, listAiMemory } from '@/lib/ai/memory';
import { prisma } from '@/lib/prisma';
import { AiPersonalizationControls } from './AiPersonalizationControls';
import { AiPrivacyControls } from './AiPrivacyControls';

export type AiPersonalizationProps = Record<string, never>;

export default async function AiPersonalization({}: AiPersonalizationProps) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fsettings%2Fai');
  }

  const userId = session.user.id;
  const memoryAllowed = await canPersistAiMemory(userId);
  const [recentMessages, settings] = await Promise.all([
    memoryAllowed ? listAiMemory(userId, 25) : Promise.resolve([]),
    prisma.userSettings.findUnique({
      where: { userId },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: true,
        goalReminders: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">AI Personalization & Privacy</h1>

      <AiPrivacyControls />

      <AiPersonalizationControls
        initialSettings={{
          emailNotifications: settings?.emailNotifications ?? true,
          pushNotifications: settings?.pushNotifications ?? true,
          weeklyReports: settings?.weeklyReports ?? true,
          goalReminders: settings?.goalReminders ?? true,
        }}
      />

      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Recent AI Interactions</h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentMessages.length > 0 ? (
            recentMessages.map(msg => (
              <li key={msg.id} className="py-4">
                <div className="mb-1 text-sm text-gray-700 dark:text-gray-200">{msg.content}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {msg.createdAt.toLocaleString()}
                </div>
              </li>
            ))
          ) : (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No AI interactions yet. Start a conversation with the StackZen assistant to see your
              history here.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
