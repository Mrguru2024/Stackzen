import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdminSession, logAdminAudit } from '@/lib/api/require-admin';
import {
  adminUserPublicSelect,
  adminUserSensitiveSelect,
  auditAdminSensitiveView,
  parseIncludeSensitive,
} from '@/lib/api/admin-pii';
import { _RedisEdge } from '@/lib/redis-edge';
import { getClientIp } from '@/lib/api/rate-limit-request';

const patchSchema = z
  .object({
    userId: z.string().cuid(),
    subscriptionLevel: z.enum(['FREE', 'PRO', 'LIFETIME', 'ZEN_PLUS', 'COACHING_SESSION']),
  })
  .strict();

export async function GET(request: Request) {
  try {
    const { user, response } = await requireAdminSession();
    if (response || !user) return response;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const roleFilter = searchParams.get('role');
    const includeSensitive = parseIncludeSensitive(searchParams);

    if (includeSensitive) {
      await auditAdminSensitiveView({
        adminUserId: user.id,
        resource: 'users.list',
        request,
        fields: ['email'],
      });
    }

    const where =
      roleFilter && ['USER', 'ADMIN', 'PRO', 'SUPER_ADMIN'].includes(roleFilter)
        ? { role: roleFilter as 'USER' | 'ADMIN' | 'PRO' | 'SUPER_ADMIN' }
        : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: includeSensitive ? adminUserSensitiveSelect : adminUserPublicSelect,
        orderBy: { lastLogin: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const usersWithFailedAttempts = await Promise.all(
      users.map(async u => {
        const failedAttempts = await _RedisEdge.get(`failed_attempts:${u.id}`);
        return {
          ...u,
          loginCount: u._count.sessions,
          failedAttempts: parseInt(failedAttempts || '0', 10),
        };
      })
    );

    return NextResponse.json({
      users: usersWithFailedAttempts,
      pagination: {
        total,
        pages: Math.ceil(total / limit) || 1,
        page,
        limit,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, response } = await requireAdminSession();
    if (response || !user) return response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { subscriptionLevel: parsed.data.subscriptionLevel },
      select: { id: true, subscriptionLevel: true },
    });

    await logAdminAudit({
      adminUserId: user.id,
      action: 'admin.user.subscription_update',
      resource: updatedUser.id,
      details: { subscriptionLevel: updatedUser.subscriptionLevel },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
