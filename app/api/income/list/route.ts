import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import type { IncomeListItem } from '@/app/lib/api';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    const incomeList = await prisma.income.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const result: IncomeListItem[] = incomeList.map(i => ({
      id: i.id,
      client: i.source,
      amount: i.amount,
      date: i.createdAt,
      status: 'completed',
      type: 'one-time',
    }));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching income list:', error);
    return NextResponse.json({ error: 'Failed to fetch income list' }, { status: 500 });
  }
}
