import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (user?.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }
  try {
    const gigs = await prisma.gig.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        curated: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(gigs);
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
