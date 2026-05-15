import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { DeveloperDashboard, type DeveloperDashboardMetrics } from '@/components/developer/DeveloperDashboard';
import { prisma } from '@/lib/prisma';
import type { AuditLog, Prisma } from '@prisma/client';
import { RoleGuard } from '@/components/auth/RoleGuard';

function mapAuditSeverityToUi(severity: string): 'low' | 'medium' | 'high' {
  const s = severity.toLowerCase();
  if (s === 'error' || s === 'critical') return 'high';
  if (s === 'warn' || s === 'warning') return 'medium';
  return 'low';
}

function formatAuditLogMessage(log: Pick<AuditLog, 'action' | 'resource' | 'details'>): string {
  const parts: string[] = [log.action];
  if (log.resource) parts.push(log.resource);
  if (log.details != null) {
    const d =
      typeof log.details === 'string'
        ? log.details
        : JSON.stringify(log.details as Prisma.JsonValue);
    if (d && d !== '{}' && d !== 'null') parts.push(d);
  }
  return parts.join(' · ');
}

function mapRecentErrorsForDashboard(logs: AuditLog[]): DeveloperDashboardMetrics['recentErrors'] {
  return logs.map(log => ({
    id: log.id,
    message: formatAuditLogMessage(log),
    timestamp: log.createdAt.toISOString(),
    severity: mapAuditSeverityToUi(log.severity),
  }));
}

function mapDeploymentLogsForDashboard(logs: AuditLog[]): DeveloperDashboardMetrics['recentDeployments'] {
  return logs.map(log => {
    const details =
      log.details && typeof log.details === 'object' && !Array.isArray(log.details)
        ? (log.details as Record<string, unknown>)
        : {};
    const version =
      typeof details.version === 'string'
        ? details.version
        : typeof log.resource === 'string' && log.resource.length > 0
          ? log.resource
          : '—';
    const raw = typeof details.status === 'string' ? details.status.toLowerCase() : '';
    const status: 'success' | 'failed' | 'in_progress' =
      raw === 'failed' ? 'failed' : raw === 'in_progress' || raw === 'pending' ? 'in_progress' : 'success';
    return {
      id: log.id,
      version,
      status,
      timestamp: log.createdAt.toISOString(),
    };
  });
}

function parseSystemHealthPayload(json: unknown): DeveloperDashboardMetrics['systemHealth'] {
  const defaults: DeveloperDashboardMetrics['systemHealth'] = {
    database: false,
    redis: false,
    api: false,
  };
  if (!json || typeof json !== 'object') return defaults;
  const root = json as Record<string, unknown>;
  const services = root.services;
  if (!services || typeof services !== 'object') return defaults;
  const s = services as Record<string, unknown>;

  const dbObj = s.database;
  const database = Boolean(
    dbObj && typeof dbObj === 'object' && (dbObj as { status?: string }).status === 'healthy'
  );

  const redisObj = s.redis;
  const redisHealthy = Boolean(
    redisObj && typeof redisObj === 'object' && (redisObj as { status?: string }).status === 'healthy'
  );

  const apiArr = s.api;
  const api = Boolean(
    Array.isArray(apiArr) &&
      apiArr.length > 0 &&
      apiArr.every(
        ep => ep && typeof ep === 'object' && (ep as { status?: string }).status === 'healthy'
      )
  );

  return { database, redis: redisHealthy, api };
}

async function getDeveloperMetrics(): Promise<DeveloperDashboardMetrics> {
  const [totalErrors, recentErrorRows, activeUsers, systemHealthJson, recentDeploymentRows] =
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
      (async () => {
        const base = process.env.NEXTAUTH_URL;
        if (!base) return null;
        try {
          const res = await fetch(`${base}/api/admin/system-health`, { next: { revalidate: 60 } });
          if (!res.ok) return null;
          return (await res.json()) as unknown;
        } catch {
          return null;
        }
      })(),
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
    recentErrors: mapRecentErrorsForDashboard(recentErrorRows),
    activeUsers,
    systemHealth: parseSystemHealthPayload(systemHealthJson),
    recentDeployments: mapDeploymentLogsForDashboard(recentDeploymentRows),
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
