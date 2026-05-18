import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';
import { hasAllVettingDocuments, MENTOR_DOCUMENT_FIELDS, type MentorDocumentKind } from '@/lib/mentors/vetting';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.pdf']);

const kindSchema = z.enum(['headshot', 'license', 'id']);

export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const mentor = await prisma.mentor.findUnique({ where: { userId: session.user.id } });
  if (!mentor) {
    return NextResponse.json({ error: 'Apply to become a mentor first' }, { status: 404 });
  }

  if (mentor.applicationStatus === 'REJECTED') {
    return NextResponse.json({ error: 'Application was rejected' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const kindRaw = formData.get('kind');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const kindParsed = kindSchema.safeParse(kindRaw);
    if (!kindParsed.success) {
      return NextResponse.json({ error: 'Invalid document kind' }, { status: 400 });
    }

    const kind = kindParsed.data as MentorDocumentKind;

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase() || '.png';
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (kind === 'headshot' && ext === '.pdf') {
      return NextResponse.json({ error: 'Headshot must be an image file' }, { status: 400 });
    }

    const fileName = `mentor-${kind}-${session.user.id}-${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'mentors');
    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, fileName), buffer);
    const url = `/uploads/mentors/${fileName}`;

    const field = MENTOR_DOCUMENT_FIELDS[kind];
    const interim = { ...mentor, [field]: url };
    const documentsComplete = hasAllVettingDocuments(interim);

    const final = await prisma.mentor.update({
      where: { id: mentor.id },
      data: {
        [field]: url,
        documentsSubmittedAt: documentsComplete ? new Date() : null,
      },
    });

    return NextResponse.json({
      url,
      kind,
      documentsComplete: hasAllVettingDocuments(final),
      headshotUrl: final.headshotUrl,
      licenseUrl: final.licenseUrl,
      idUrl: final.idUrl,
    });
  } catch (error) {
    console.error('[MENTOR_DOCUMENT_UPLOAD]', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
