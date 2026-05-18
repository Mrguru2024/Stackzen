import type { Mentor } from '@prisma/client';

export type MentorDocumentKind = 'headshot' | 'license' | 'id';

export const MENTOR_DOCUMENT_FIELDS: Record<MentorDocumentKind, keyof Pick<Mentor, 'headshotUrl' | 'licenseUrl' | 'idUrl'>> = {
  headshot: 'headshotUrl',
  license: 'licenseUrl',
  id: 'idUrl',
};

export function hasAllVettingDocuments(mentor: Pick<Mentor, 'headshotUrl' | 'licenseUrl' | 'idUrl'>): boolean {
  return Boolean(mentor.headshotUrl?.trim() && mentor.licenseUrl?.trim() && mentor.idUrl?.trim());
}

/** Mentors visible in the public directory and bookable by users. */
export function isMentorListedForBooking(
  mentor: Pick<Mentor, 'isVerified' | 'isActive' | 'applicationStatus'>
): boolean {
  return (
    mentor.isVerified &&
    mentor.isActive &&
    mentor.applicationStatus === 'SETUP_COMPLETE'
  );
}

export function canAdminApprove(
  mentor: Pick<Mentor, 'headshotUrl' | 'licenseUrl' | 'idUrl' | 'applicationStatus'>
): { ok: boolean; reason?: string } {
  if (mentor.applicationStatus === 'REJECTED') {
    return { ok: false, reason: 'Application was rejected. Mentor must re-apply.' };
  }
  if (!hasAllVettingDocuments(mentor)) {
    return { ok: false, reason: 'Headshot, license, and government ID must be uploaded before approval.' };
  }
  return { ok: true };
}
