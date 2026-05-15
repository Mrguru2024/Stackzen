import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminSession } from '@/lib/api/require-admin';

export async function GET() {
  const { response } = await requireAdminSession();
  if (response) return response;

  try {
    // Get all feedback
    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Calculate statistics
    const totalFeedback = feedback.length;
    const averageTimeSpent = calculateAverageTimeSpent(feedback);
    const featureUsage = calculateFeatureUsage(feedback);
    const performance = calculatePerformanceStats(feedback);
    const deviceBreakdown = calculateDeviceBreakdown(feedback);

    return NextResponse.json({
      totalFeedback,
      averageTimeSpent,
      featureUsage,
      performance,
      deviceBreakdown,
    });
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateAverageTimeSpent(feedback: any[]): string {
  if (feedback.length === 0) return '0 hours';

  const totalMinutes = feedback.reduce((acc, curr) => {
    const timeSpent = curr.timeSpent;
    const hours = parseInt(timeSpent.split(' ')[0]);
    return acc + hours * 60;
  }, 0);

  const averageHours = Math.round(totalMinutes / feedback.length / 60);
  return `${averageHours} hours`;
}

function calculateFeatureUsage(feedback: any[]): Record<string, number> {
  const usage: Record<string, number> = {};

  feedback.forEach(item => {
    item.featuresUsed.forEach((feature: string) => {
      usage[feature] = (usage[feature] || 0) + 1;
    });
  });

  return usage;
}

function calculatePerformanceStats(feedback: any[]): {
  pageLoadTimes: Record<string, number>;
  responseTimes: Record<string, number>;
  lagIssues: number;
} {
  const stats = {
    pageLoadTimes: {} as Record<string, number>,
    responseTimes: {} as Record<string, number>,
    lagIssues: 0,
  };

  feedback.forEach(item => {
    const { performance } = item;

    // Count page load times
    stats.pageLoadTimes[performance.pageLoadTimes] =
      (stats.pageLoadTimes[performance.pageLoadTimes] || 0) + 1;

    // Count response times
    stats.responseTimes[performance.responseTimes] =
      (stats.responseTimes[performance.responseTimes] || 0) + 1;

    // Count lag issues
    if (performance.lagFreezing) {
      stats.lagIssues++;
    }
  });

  return stats;
}

function calculateDeviceBreakdown(feedback: any[]): Record<string, number> {
  const breakdown: Record<string, number> = {};

  feedback.forEach(item => {
    const deviceType = item.deviceInfo.deviceType;
    breakdown[deviceType] = (breakdown[deviceType] || 0) + 1;
  });

  return breakdown;
}
