import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

// Custom error class for API errors
class APIError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

// Type for the session with user data
type SessionWithUser = Session & {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
};

// Validate session and user data
function validateSession(session: SessionWithUser | null): asserts session is SessionWithUser {
  if (!session) {
    throw new APIError(401, 'No session found');
  }
  if (!session.user) {
    throw new APIError(401, 'No user found in session');
  }
  if (!session.user.id) {
    throw new APIError(401, 'No user ID found in session');
  }
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;
    validateSession(session);

    // Get all completed bookings with their services
    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: 'completed',
      },
      include: {
        service: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Transform bookings into income records
    const incomes = bookings.map(booking => ({
      id: booking.id,
      amount: booking.service?.price || 0,
      description: booking.service?.title || 'Service',
      date: booking.date,
      category: booking.service?.category || 'Uncategorized',
      status: booking.status,
    }));

    return NextResponse.json(incomes);
  } catch (error) {
    console.error('Error fetching incomes:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionWithUser;
    validateSession(session);

    const body = await request.json();
    const { serviceId, date, time, notes } = body;

    if (!serviceId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a new booking
    const booking = await prisma.booking.create({
      data: {
        serviceId,
        userId: session.user.id,
        date: new Date(date),
        time: time || '12:00',
        notes: notes || '',
        status: 'pending',
      },
      include: {
        service: true,
      },
    });

    // Transform booking into income record
    const income = {
      id: booking.id,
      amount: booking.service?.price || 0,
      description: booking.service?.title || 'Service',
      date: booking.date,
      category: booking.service?.category || 'Uncategorized',
      status: booking.status,
    };

    return NextResponse.json(income, { status: 201 });
  } catch (error) {
    console.error('Error creating income:', error);

    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
