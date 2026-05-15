import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { recordOperationalActivationMilestones } from '@/lib/operational-activation/record-milestones';

export async function POST() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const result = await recordOperationalActivationMilestones(session.user.id);
  return NextResponse.json(result);
}
