import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthSession } from '@/lib/api/require-auth';

export async function GET() {
  const { session, response } = await requireAuthSession();
  if (response) return response;

  const accounts = await prisma.savingsAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(accounts);
}
