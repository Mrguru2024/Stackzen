import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/api/rate-limit-request';
import { logAdminAudit, requireAdminSession } from '@/lib/api/require-admin';
import { canAdminApprove, hasAllVettingDocuments } from '@/lib/mentors/vetting';
import { emailService } from '@/lib/email/emailService';

const patchSchema = z
  .object({
    mentorId: z.string().cuid(),
    action: z.enum(['APPROVE', 'REJECT', 'CERTIFY', 'VERIFY', 'ACTIVATE', 'DEACTIVATE']),
    rejectionReason: z.string().max(500).optional(),
    vettingNotes: z.string().max(2000).optional(),
  })
  .strict();

export async function GET() {
  try {
    const { response } = await requireAdminSession();
    if (response) return response;

    const mentors = await prisma.mentor.findMany({
      include: {
        user: { select: { email: true } },
        reviews: { select: { rating: true } },
        sessions: { where: { status: 'COMPLETED' }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const payload = mentors.map(mentor => {
      const reviewsCount = mentor.reviews.length;
      const averageRating =
        reviewsCount > 0
          ? mentor.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
          : mentor.rating;

      let status: 'pending' | 'approved' | 'rejected' | 'setup' | 'live' = 'pending';
      if (mentor.applicationStatus === 'REJECTED') status = 'rejected';
      else if (mentor.applicationStatus === 'SETUP_COMPLETE') status = 'live';
      else if (mentor.applicationStatus === 'APPROVED') status = 'setup';
      else if (mentor.isVerified) status = 'approved';
      else status = 'pending';

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
        applicationStatus: mentor.applicationStatus,
        createdAt: mentor.createdAt.toISOString(),
        documentsSubmittedAt: mentor.documentsSubmittedAt?.toISOString() ?? null,
        onboardingCompletedAt: mentor.onboardingCompletedAt?.toISOString() ?? null,
        headshotUrl: mentor.headshotUrl,
        licenseUrl: mentor.licenseUrl,
        idUrl: mentor.idUrl,
        documentsComplete: hasAllVettingDocuments(mentor),
        vettingNotes: mentor.vettingNotes,
        rejectionReason: mentor.rejectionReason,
        totalSessions: mentor.sessions.length,
        rating: averageRating,
        status,
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

    const { mentorId, action, rejectionReason, vettingNotes } = parsed.data;

    const existing = await prisma.mentor.findUnique({ where: { id: mentorId } });
    if (!existing) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const gate = canAdminApprove(existing);
      if (!gate.ok) {
        return NextResponse.json({ error: gate.reason }, { status: 400 });
      }
    }

    const data: {
      isVerified?: boolean;
      isActive?: boolean;
      isCertified?: boolean;
      applicationStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'SETUP_COMPLETE' | 'REJECTED';
      rejectionReason?: string | null;
      vettingNotes?: string | null;
    } = {};

    if (vettingNotes !== undefined) {
      data.vettingNotes = vettingNotes;
    }

    if (action === 'APPROVE') {
      data.isVerified = true;
      data.isActive = false;
      data.applicationStatus = 'APPROVED';
      data.rejectionReason = null;
    } else if (action === 'REJECT') {
      data.isVerified = false;
      data.isActive = false;
      data.applicationStatus = 'REJECTED';
      data.rejectionReason = rejectionReason?.trim() || 'Did not meet vetting requirements';
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
        applicationStatus: true,
        rejectionReason: true,
      },
    });

    if (action === 'APPROVE') {
      try {
        const approved = await prisma.mentor.findUnique({
          where: { id: mentorId },
          include: { user: { select: { email: true, name: true } } },
        });
        if (approved?.user?.email) {
          await emailService.sendMentorApplicationApproved(
            approved.user.email,
            approved.user.name || approved.name,
            '<ol><li>Open your Mentor hub and complete setup</li><li>Confirm your public bio and hourly rate</li><li>Go live in the mentor directory</li></ol>'
          );
        }
      } catch (emailErr) {
        console.error('[ADMIN_MENTOR] approval email failed', emailErr);
      }
    }

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
