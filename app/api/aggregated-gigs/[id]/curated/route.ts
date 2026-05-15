import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
    const { curated } = await request.json();
    if (typeof curated !== 'boolean') {
      return new NextResponse('Invalid value', { status: 400 });
    }
    const gig = await prisma.gig.update({
      where: { id: params.id },
      data: { curated },
      select: {
        id: true,
        curated: true,
      },
    });
    return NextResponse.json(gig);
  } catch {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
