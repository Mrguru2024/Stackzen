import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const buckets = await prisma.smartBucket.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        allocations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(buckets);
  } catch (error) {
    console.error('Error fetching smart buckets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, targetAmount, color, icon } = body;

    const bucket = await prisma.smartBucket.create({
      data: {
        userId: user.id,
        name,
        type,
        targetAmount,
        color,
        icon,
        currentAmount: 0,
        isActive: true,
      },
    });

    return NextResponse.json(bucket);
  } catch (error) {
    console.error('Error creating smart bucket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
