import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Mock data - replace with database in production
const mockChallenges = [
  {
    id: '1',
    title: 'Emergency Fund Challenge',
    description: 'Build a 6-month emergency fund',
    targetAmount: 15000,
    currentAmount: 5000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-06-30'),
    participants: 45,
    type: 'personal',
    category: 'emergency',
    status: 'active',
  },
  {
    id: '2',
    title: 'Summer Vacation Fund',
    description: 'Save for your dream summer vacation',
    targetAmount: 5000,
    currentAmount: 2000,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-07-31'),
    participants: 78,
    type: 'group',
    category: 'vacation',
    status: 'active',
  },
  {
    id: '3',
    title: 'Education Savings',
    description: 'Save for future education expenses',
    targetAmount: 10000,
    currentAmount: 7500,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    participants: 32,
    type: 'personal',
    category: 'education',
    status: 'active',
  },
];

export async function GET(_request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In a real implementation, you would:
    // 1. Fetch challenges from the database
    // 2. Filter based on user's access and preferences
    // 3. Include user's progress in each challenge

    return NextResponse.json({
      challenges: mockChallenges,
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const input = await request.json();

    // Validate input
    if (!input.title || !input.targetAmount || !input.startDate || !input.endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Validate the input data
    // 2. Create the challenge in the database
    // 3. Add the creator as a participant
    // 4. Set up notifications and reminders

    const newChallenge = {
      id: crypto.randomUUID(),
      ...input,
      currentAmount: 0,
      participants: 1,
      status: 'upcoming',
    };

    return NextResponse.json(newChallenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}
