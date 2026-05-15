import { NextResponse } from 'next/server';
import { requireAuthSession } from '@/lib/api/require-auth';
import { buildConnectivitySnapshot } from '@/lib/bank/connectivity-snapshot';

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const body = await buildConnectivitySnapshot(session.user.id);
  return NextResponse.json(body);
}
