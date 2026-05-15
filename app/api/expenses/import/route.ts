import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const { transactions } = await req.json();

    // Create expenses from transactions
    const expenses = await Promise.all(
      transactions.map((transaction: any) =>
        prisma.expense.create({
          data: {
            userId: user.id,
            date: new Date(transaction.date),
            description: transaction.name,
            category: transaction.category,
            amount: Math.abs(transaction.amount),
            tags: transaction.category ? [transaction.category] : [],
          },
        })
      )
    );

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('[EXPENSES_IMPORT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
