import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get('specialty');
    const priceRange = searchParams.get('priceRange');
    const certifiedOnly = searchParams.get('certifiedOnly') === 'true';
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (specialty) {
      where.specialties = {
        has: specialty,
      };
    }

    if (certifiedOnly) {
      where.isCertified = true;
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      if (max) {
        where.hourlyRate = {
          gte: min,
          lte: max,
        };
      } else {
        where.hourlyRate = {
          gte: min,
        };
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { specialties: { has: search } },
      ];
    }

    const mentors = await prisma.mentor.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        sessions: {
          where: {
            status: 'COMPLETED',
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });

    // Calculate average ratings and session counts
    const mentorsWithStats = mentors.map(mentor => {
      const totalRating = mentor.reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = mentor.reviews.length > 0 ? totalRating / mentor.reviews.length : 0;

      return {
        id: mentor.id,
        name: mentor.name,
        bio: mentor.bio,
        specialties: mentor.specialties,
        rating: averageRating,
        totalSessions: mentor.sessions.length,
        hourlyRate: mentor.hourlyRate,
        isCertified: mentor.isCertified,
        isVerified: mentor.isVerified,
        yearsOfExperience: mentor.yearsOfExperience,
        credentials: mentor.credentials,
        headshotUrl: mentor.headshotUrl,
        languages: mentor.languages,
        availability: mentor.availability,
        user: mentor.user,
      };
    });

    return NextResponse.json(mentorsWithStats);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      bio,
      specialties,
      credentials,
      licenseNumber,
      licenseType,
      yearsOfExperience,
      hourlyRate,
      availability,
      languages,
      headshotUrl,
      licenseUrl,
      idUrl,
    } = body;

    // Check if user already has a mentor profile
    const existingMentor = await prisma.mentor.findUnique({
      where: { userId: session.user.id },
    });

    if (existingMentor) {
      return NextResponse.json({ error: 'Mentor profile already exists' }, { status: 400 });
    }

    const mentor = await prisma.mentor.create({
      data: {
        userId: session.user.id,
        name,
        bio,
        specialties,
        credentials,
        licenseNumber,
        licenseType,
        yearsOfExperience,
        hourlyRate,
        availability,
        languages,
        headshotUrl,
        licenseUrl,
        idUrl,
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

    return NextResponse.json(mentor);
  } catch (error) {
    console.error('Error creating mentor profile:', error);
    return NextResponse.json({ error: 'Failed to create mentor profile' }, { status: 500 });
  }
}
