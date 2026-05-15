import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { gigId, applicationData } = await req.json();
  if (!gigId || !applicationData) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    select: { id: true },
  });

  if (!gig) {
    return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const coverLetter =
    typeof applicationData === 'string'
      ? applicationData
      : typeof applicationData?.coverLetter === 'string'
        ? applicationData.coverLetter
        : JSON.stringify(applicationData);

  const application = await prisma.gigApplication.create({
    data: {
      gigId,
      userId: user.id,
      status: 'pending',
      coverLetter,
    },
  });

  return NextResponse.json(application);
}
