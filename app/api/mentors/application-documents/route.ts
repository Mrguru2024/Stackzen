import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { requireAuthSession } from '@/lib/api/require-auth';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.pdf']);
const kindSchema = z.enum(['headshot', 'license', 'id']);

/** Upload vetting files during application (before Mentor row exists). Returns URL for form state. */
export async function POST(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const kindParsed = kindSchema.safeParse(formData.get('kind'));

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (!kindParsed.success) {
      return NextResponse.json({ error: 'Invalid document kind' }, { status: 400 });
    }

    const kind = kindParsed.data;
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

    const fileName = `mentor-app-${kind}-${session.user.id}-${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'mentors');
    await fs.mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, fileName), buffer);

    return NextResponse.json({ url: `/uploads/mentors/${fileName}`, kind });
  } catch (error) {
    console.error('[MENTOR_APP_DOCUMENT]', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
