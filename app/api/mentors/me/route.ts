import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';
import { hasAllVettingDocuments, isMentorListedForBooking } from '@/lib/mentors/vetting';

const patchSchema = z
  .object({
    bio: z.string().max(5000).optional(),
    hourlyRate: z.number().min(50).max(2000).optional(),
    availability: z.union([z.array(z.string()), z.record(z.unknown())]).optional(),
    specialties: z.array(z.string()).max(24).optional(),
    languages: z.array(z.string()).max(12).optional(),
    completeOnboarding: z.boolean().optional(),
  })
  .strict();

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const mentor = await prisma.mentor.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { email: true, name: true, image: true } },
    },
  });

  if (!mentor) {
    return NextResponse.json({ mentor: null });
  }

  return NextResponse.json({
    mentor: {
      id: mentor.id,
      name: mentor.name,
      bio: mentor.bio,
      specialties: mentor.specialties,
      credentials: mentor.credentials,
      licenseNumber: mentor.licenseNumber,
      licenseType: mentor.licenseType,
      yearsOfExperience: mentor.yearsOfExperience,
      hourlyRate: mentor.hourlyRate,
      availability: mentor.availability,
      languages: mentor.languages,
      headshotUrl: mentor.headshotUrl,
      licenseUrl: mentor.licenseUrl,
      idUrl: mentor.idUrl,
      isCertified: mentor.isCertified,
      isVerified: mentor.isVerified,
      isActive: mentor.isActive,
      applicationStatus: mentor.applicationStatus,
      documentsSubmittedAt: mentor.documentsSubmittedAt?.toISOString() ?? null,
      onboardingCompletedAt: mentor.onboardingCompletedAt?.toISOString() ?? null,
      rejectionReason: mentor.rejectionReason,
      documentsComplete: hasAllVettingDocuments(mentor),
      listedForBooking: isMentorListedForBooking(mentor),
      user: mentor.user,
    },
  });
}

export async function PATCH(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

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

  const existing = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
  }

  if (existing.applicationStatus === 'REJECTED') {
    return NextResponse.json({ error: 'Application was rejected' }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
  if (parsed.data.hourlyRate !== undefined) data.hourlyRate = parsed.data.hourlyRate;
  if (parsed.data.availability !== undefined) data.availability = parsed.data.availability;
  if (parsed.data.specialties !== undefined) data.specialties = parsed.data.specialties;
  if (parsed.data.languages !== undefined) data.languages = parsed.data.languages;

  if (parsed.data.completeOnboarding) {
    if (existing.applicationStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Complete onboarding is only available after admin approval' },
        { status: 400 }
      );
    }
    if (!existing.bio?.trim() || !existing.hourlyRate) {
      return NextResponse.json(
        { error: 'Bio and hourly rate are required before going live' },
        { status: 400 }
      );
    }
    data.applicationStatus = 'SETUP_COMPLETE';
    data.onboardingCompletedAt = new Date();
    data.isActive = true;
  }

  const updated = await prisma.mentor.update({
    where: { id: existing.id },
    data,
  });

  return NextResponse.json({
    mentor: {
      id: updated.id,
      applicationStatus: updated.applicationStatus,
      onboardingCompletedAt: updated.onboardingCompletedAt?.toISOString() ?? null,
      listedForBooking: isMentorListedForBooking(updated),
    },
  });
}
