import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { buildWorkflowResolutionSnapshot } from '@/lib/workflow-resolution/snapshot';
import { clampWindowDays } from '@/lib/workflow-resolution/aggregate';

export async function GET(request: Request) {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const url = new URL(request.url);
  const windowDays = clampWindowDays(url.searchParams.get('windowDays'), 14);

  const snapshot = await buildWorkflowResolutionSnapshot(session.user.id, { windowDays });
  return NextResponse.json(snapshot);
}
