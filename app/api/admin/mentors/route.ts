import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/api/rate-limit-request';
import { logAdminAudit, requireAdminSession } from '@/lib/api/require-admin';

const patchSchema = z
  .object({
    mentorId: z.string().cuid(),
    action: z.enum(['APPROVE', 'REJECT', 'CERTIFY', 'VERIFY', 'ACTIVATE', 'DEACTIVATE']),
  })
  .strict();

export async function GET() {
  try {
    const { response } = await requireAdminSession();
    if (response) return response;

    const mentors = await prisma.mentor.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        sessions: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const payload = mentors.map(mentor => {
      const reviewsCount = mentor.reviews.length;
      const averageRating =
        reviewsCount > 0
          ? mentor.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
          : mentor.rating;

      return {
        id: mentor.id,
        name: mentor.name,
        email: mentor.user.email,
        specialties: mentor.specialties,
        credentials: mentor.credentials,
        yearsOfExperience: mentor.yearsOfExperience ?? 0,
        hourlyRate: mentor.hourlyRate ?? 0,
        isCertified: mentor.isCertified,
        isVerified: mentor.isVerified,
        isActive: mentor.isActive,
        createdAt: mentor.createdAt.toISOString(),
        totalSessions: mentor.sessions.length,
        rating: averageRating,
        status: mentor.isVerified ? 'approved' : 'pending',
      };
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Error fetching admin mentors:', error);
    return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
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

    const { mentorId, action } = parsed.data;
    const existing = await prisma.mentor.findUnique({
      where: { id: mentorId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    const data: { isVerified?: boolean; isActive?: boolean; isCertified?: boolean } = {};

    if (action === 'APPROVE') {
      data.isVerified = true;
      data.isActive = true;
    } else if (action === 'REJECT') {
      data.isVerified = false;
      data.isActive = false;
    } else if (action === 'CERTIFY') {
      data.isCertified = true;
    } else if (action === 'VERIFY') {
      data.isVerified = true;
    } else if (action === 'ACTIVATE') {
      data.isActive = true;
    } else if (action === 'DEACTIVATE') {
      data.isActive = false;
    }

    const updated = await prisma.mentor.update({
      where: { id: mentorId },
      data,
      select: {
        id: true,
        isVerified: true,
        isActive: true,
        isCertified: true,
      },
    });

    await logAdminAudit({
      adminUserId: user.id,
      action: 'admin.mentor.update',
      resource: mentorId,
      details: { action, ...updated },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating mentor from admin:', error);
    return NextResponse.json({ error: 'Failed to update mentor' }, { status: 500 });
  }
}
