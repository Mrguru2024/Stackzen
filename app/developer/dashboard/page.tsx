import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { DeveloperDashboard } from '@/components/developer/DeveloperDashboard';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';
import { RoleGuard } from '@/components/auth/RoleGuard';

const redis = new Redis(process.env.REDIS_URL!);

async function getDeveloperMetrics() {
  const [totalErrors, recentErrors, activeUsers, systemHealth, recentDeployments] =
    await Promise.all([
      prisma.auditLog.count({
        where: {
          severity: 'error',
        },
      }),
      prisma.auditLog.findMany({
        where: {
          severity: 'error',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      fetch(`${process.env.NEXTAUTH_URL}/api/admin/system-health`).then(res => res.json()),
      prisma.auditLog.findMany({
        where: {
          action: 'deployment',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      }),
    ]);

  return {
    totalErrors,
    recentErrors,
    activeUsers,
    systemHealth,
    recentDeployments,
  };
}

export default async function DeveloperDashboardPage() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const metrics = await getDeveloperMetrics();

  return (
    <RoleGuard allowedRoles={['developer', 'admin']}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Developer Dashboard</h1>
        <DeveloperDashboard metrics={metrics} />
      </div>
    </RoleGuard>
  );
}
