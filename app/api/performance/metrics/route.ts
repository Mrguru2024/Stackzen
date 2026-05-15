import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';

/** Sub-resource for performance metrics (minimal Phase-1 stub; extend as needed). */
export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;
  return NextResponse.json({ userId: session.user.id, metrics: [] });
}
