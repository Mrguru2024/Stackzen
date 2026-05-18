import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';
import { hasAllVettingDocuments, isMentorListedForBooking } from '@/lib/mentors/vetting';
import { emailService } from '@/lib/email/emailService';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  bio: z.string().min(20).max(5000),
  specialties: z.array(z.string()).min(1).max(24),
  credentials: z.array(z.string()).max(24),
  licenseNumber: z.string().max(80).optional(),
  licenseType: z.string().max(80).optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(60),
  hourlyRate: z.coerce.number().min(50).max(2000),
  availability: z.union([z.array(z.string()), z.record(z.unknown())]),
  languages: z.array(z.string()).min(1).max(12),
  headshotUrl: z.string().max(500).optional().or(z.literal('')),
  licenseUrl: z.string().max(500).optional().or(z.literal('')),
  idUrl: z.string().max(500).optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const priceRange = searchParams.get('priceRange');
    const certifiedOnly = searchParams.get('certifiedOnly') === 'true';
    const search = searchParams.get('search');
    const includePending = searchParams.get('includePending') === 'true';

    const where: {
      isActive: boolean;
      isVerified?: boolean;
      applicationStatus?: 'SETUP_COMPLETE' | { not: 'REJECTED' };
      specialties?: { has: string };
      isCertified?: boolean;
      hourlyRate?: { gte: number; lte?: number };
      OR?: Array<Record<string, unknown>>;
    } = {
      isActive: true,
    };

    if (!includePending) {
      where.isVerified = true;
      where.applicationStatus = 'SETUP_COMPLETE';
    }

    if (specialty) {
      where.specialties = { has: specialty };
    }

    if (certifiedOnly) {
      where.isCertified = true;
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      if (max) {
        where.hourlyRate = { gte: min, lte: max };
      } else {
        where.hourlyRate = { gte: min };
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { specialties: { has: search } },
      ];
    }

    const mentors = await prisma.mentor.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        reviews: {
          select: { rating: true },
        },
        sessions: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
      },
      orderBy: { rating: 'desc' },
    });

    const mentorsWithStats = mentors
      .filter(m => includePending || isMentorListedForBooking(m))
      .map(mentor => {
        const totalRating = mentor.reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating =
          mentor.reviews.length > 0 ? totalRating / mentor.reviews.length : mentor.rating;

        return {
          id: mentor.id,
          name: mentor.name,
          bio: mentor.bio,
          specialties: mentor.specialties,
          rating: averageRating,
          totalSessions: mentor.sessions.length,
          hourlyRate: mentor.hourlyRate,
          isCertified: mentor.isCertified,
          isVerified: mentor.isVerified,
          yearsOfExperience: mentor.yearsOfExperience,
          credentials: mentor.credentials,
          headshotUrl: mentor.headshotUrl,
          languages: mentor.languages,
          availability: mentor.availability,
          user: mentor.user,
        };
      });

    return NextResponse.json(mentorsWithStats);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAuthSession();
    if (response) return response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid application data' }, { status: 400 });
    }

    const existingMentor = await prisma.mentor.findUnique({
      where: { userId: session.user.id },
    });

    if (existingMentor && existingMentor.applicationStatus !== 'REJECTED') {
      return NextResponse.json({ error: 'Mentor profile already exists' }, { status: 400 });
    }

    const {
      name,
      bio,
      specialties,
      credentials,
      licenseNumber,
      licenseType,
      yearsOfExperience,
      hourlyRate,
      availability,
      languages,
      headshotUrl,
      licenseUrl,
      idUrl,
    } = parsed.data;

    const docPayload = {
      headshotUrl: headshotUrl || null,
      licenseUrl: licenseUrl || null,
      idUrl: idUrl || null,
    };
    const availabilityJson = availability as Prisma.InputJsonValue;
    const documentsComplete = hasAllVettingDocuments(docPayload);

    const mentor =
      existingMentor?.applicationStatus === 'REJECTED'
        ? await prisma.mentor.update({
            where: { id: existingMentor.id },
            data: {
              name,
              bio,
              specialties,
              credentials,
              licenseNumber: licenseNumber || null,
              licenseType: licenseType || null,
              yearsOfExperience,
              hourlyRate,
              availability: availabilityJson,
              languages,
              ...docPayload,
              applicationStatus: 'PENDING_REVIEW',
              isVerified: false,
              isActive: false,
              rejectionReason: null,
              vettingNotes: null,
              documentsSubmittedAt: documentsComplete ? new Date() : null,
              onboardingCompletedAt: null,
            },
            include: {
              user: { select: { name: true, email: true, image: true } },
            },
          })
        : await prisma.mentor.create({
            data: {
              userId: session.user.id,
              name,
              bio,
              specialties,
              credentials,
              licenseNumber: licenseNumber || null,
              licenseType: licenseType || null,
              yearsOfExperience,
              hourlyRate,
              availability: availabilityJson,
              languages,
              ...docPayload,
              applicationStatus: 'PENDING_REVIEW',
              isVerified: false,
              isActive: false,
              documentsSubmittedAt: documentsComplete ? new Date() : null,
            },
            include: {
              user: { select: { name: true, email: true, image: true } },
            },
          });

    try {
      if (mentor.user.email) {
        await emailService.sendMentorApplicationReceived(
          mentor.user.email,
          mentor.user.name || mentor.name,
          mentor.id
        );
      }
    } catch (emailErr) {
      console.error('[MENTOR_APPLY] notification email failed', emailErr);
    }

    return NextResponse.json({
      mentor,
      documentsComplete: hasAllVettingDocuments(mentor),
      nextStep: documentsComplete ? 'pending_review' : 'upload_documents',
    });
  } catch (error) {
    console.error('Error creating mentor profile:', error);
    return NextResponse.json({ error: 'Failed to create mentor profile' }, { status: 500 });
  }
}
