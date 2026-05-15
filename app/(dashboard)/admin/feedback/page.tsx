import React from 'react';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Prisma } from '@prisma/client';

type FeedbackDetails = {
  timeSpent?: string;
  featuresUsed?: string[];
  performance?: {
    pageLoadTimes?: string;
    responseTimes?: string;
    lagFreezing?: boolean;
  };
  deviceInfo?: {
    deviceType?: string;
    browser?: string;
    os?: string;
  };
  suggestions?: string;
  issues?: { feature: string; description: string }[];
  featureFeedback?: { feature: string; rating: number; workedWell: string }[];
  generalComments?: string;
};

function parseDetails(raw: Prisma.JsonValue | null | undefined): FeedbackDetails | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as FeedbackDetails;
}

async function getFeedback() {
  return prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export default async function FeedbackDashboard() {
  const feedback = await getFeedback();

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between pb-8 pt-6">
        <h1 className="text-2xl font-bold">Beta Feedback Dashboard</h1>
        <ThemeToggle />
      </div>

      <div className="grid gap-6">
        {feedback.map(item => {
          const d = parseDetails(item.details);
          const featuresUsed = d?.featuresUsed ?? [];
          const performance = d?.performance;
          const deviceInfo = d?.deviceInfo;
          const issues = d?.issues ?? [];
          const featureFeedback = d?.featureFeedback ?? [];
          const generalComments = d?.generalComments ?? d?.suggestions ?? item.content;

          return (
            <div key={item.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Feedback from user {item.userId}</h2>
                  <p className="text-sm text-gray-500">
                    {format(item.createdAt, 'PPP')}
                    {d?.timeSpent ? ` — ${d.timeSpent} spent` : ''}
                  </p>
                </div>
                <div className="text-sm text-gray-500">{format(item.createdAt, 'PPp')}</div>
              </div>

              <div className="mb-2 text-sm">
                <span className="font-medium">Rating:</span> {item.rating}/5
              </div>

              <div className="space-y-4">
                {featuresUsed.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium">Features Used</h3>
                    <div className="flex flex-wrap gap-2">
                      {featuresUsed.map(feature => (
                        <span
                          key={feature}
                          className="rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {performance && (
                  <div>
                    <h3 className="mb-2 font-medium">Performance</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {performance.pageLoadTimes != null && (
                        <div>
                          <span className="text-sm text-gray-500">Page Load:</span>
                          <span className="ml-2">{performance.pageLoadTimes}</span>
                        </div>
                      )}
                      {performance.responseTimes != null && (
                        <div>
                          <span className="text-sm text-gray-500">Response Time:</span>
                          <span className="ml-2">{performance.responseTimes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {deviceInfo && (
                  <div>
                    <h3 className="mb-2 font-medium">Device Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {deviceInfo.deviceType != null && (
                        <div>
                          <span className="text-sm text-gray-500">Device:</span>
                          <span className="ml-2">{deviceInfo.deviceType}</span>
                        </div>
                      )}
                      {deviceInfo.os != null && (
                        <div>
                          <span className="text-sm text-gray-500">OS:</span>
                          <span className="ml-2">{deviceInfo.os}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {issues.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium">Issues Reported</h3>
                    <div className="space-y-2">
                      {issues.map((issue, index) => (
                        <div key={index} className="rounded bg-red-50 p-3 dark:bg-red-900/20">
                          <p className="font-medium text-red-800 dark:text-red-200">
                            {issue.feature}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-300">
                            {issue.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {featureFeedback.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium">Feature Feedback</h3>
                    <div className="space-y-2">
                      {featureFeedback.map((fb, index) => (
                        <div key={index} className="rounded bg-green-50 p-3 dark:bg-green-900/20">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-green-800 dark:text-green-200">
                              {fb.feature}
                            </p>
                            <span className="text-sm text-green-600 dark:text-green-300">
                              Rating: {fb.rating}/5
                            </span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            {fb.workedWell}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generalComments ? (
                  <div>
                    <h3 className="mb-2 font-medium">Comments</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{generalComments}</p>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
