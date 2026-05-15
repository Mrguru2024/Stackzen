import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount } = await request.json();

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // In a real implementation, you would:
    // 1. Validate the challenge exists and user is a participant
    // 2. Update the progress in the database
    // 3. Check if the challenge is completed
    // 4. Trigger notifications if milestones are reached
    // 5. Update user's total savings statistics

    // Mock response
    const updatedChallenge = {
      id: params.id,
      currentAmount: amount,
      status: amount >= 10000 ? 'completed' : 'active',
      lastUpdated: new Date(),
    };

    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
