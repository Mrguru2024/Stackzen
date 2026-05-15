import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { coverLetter, proposedBudget, estimatedDuration } = data;

    // Validate required fields
    if (!coverLetter) {
      return NextResponse.json({ error: 'Cover letter is required' }, { status: 400 });
    }

    // Check if user has already applied
    const existingApplication = await prisma.gigApplication.findFirst({
      where: {
        gigId: params.id,
        userId: session.user.id,
      },
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied for this gig' }, { status: 400 });
    }

    // Create application
    const application = await prisma.gigApplication.create({
      data: {
        gigId: params.id,
        userId: session.user.id,
        coverLetter,
        proposedBudget: proposedBudget || null,
        estimatedDuration: estimatedDuration || null,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Error in /api/gigs/[clientId]/apply:', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all applications for this gig
    const applications = await prisma.gigApplication.findMany({
      where: {
        gigId: params.id,
        // Only show applications to the gig owner or if the user is the applicant
        OR: [{ gig: { userId: session.user.id } }, { userId: session.user.id }],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error in /api/gigs/[clientId]/apply:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
