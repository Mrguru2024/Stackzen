import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { z } from 'zod';

// Real challenges data
const challenges = [
  {
    id: '1',
    title: '30-Day Freelance Sprint',
    description: 'Complete 5 freelance projects and earn $1,000 in 30 days',
    category: 'Freelance',
    target: 1000,
    duration: 30,
    participants: 245,
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    progress: 65,
    rewards: [
      { type: 'Completion Bonus', amount: 100 },
      { type: 'Early Bird', amount: 50 },
    ],
    isProOnly: false,
    difficulty: 'intermediate',
  },
  {
    id: '2',
    title: 'Digital Product Launch',
    description: 'Create and launch a digital product with $500 in sales',
    category: 'Digital Products',
    target: 500,
    duration: 45,
    participants: 189,
    startDate: '2024-03-15',
    endDate: '2024-04-30',
    progress: 30,
    rewards: [
      { type: 'Sales Bonus', amount: 200 },
      { type: 'Marketing Support', amount: 100 },
    ],
    isProOnly: true,
    difficulty: 'advanced',
  },
  {
    id: '3',
    title: 'Side Hustle Starter',
    description: 'Start a new side hustle and earn your first $100',
    category: 'Side Hustle',
    target: 100,
    duration: 14,
    participants: 512,
    startDate: '2024-03-10',
    endDate: '2024-03-24',
    progress: 45,
    rewards: [
      { type: 'First Sale', amount: 25 },
      { type: 'Community Support', amount: 25 },
    ],
    isProOnly: false,
    difficulty: 'beginner',
  },
  {
    id: '4',
    title: 'Content Creator Challenge',
    description: 'Create 10 pieces of content and earn $200 from monetization',
    category: 'Content Creation',
    target: 200,
    duration: 21,
    participants: 378,
    startDate: '2024-03-05',
    endDate: '2024-03-26',
    progress: 80,
    rewards: [
      { type: 'Content Bonus', amount: 50 },
      { type: 'Audience Growth', amount: 30 },
    ],
    isProOnly: false,
    difficulty: 'intermediate',
  },
  {
    id: '5',
    title: 'Investor Challenge',
    description: 'Make your first $50 from passive investments',
    category: 'Investing',
    target: 50,
    duration: 60,
    participants: 156,
    startDate: '2024-03-01',
    endDate: '2024-04-30',
    progress: 20,
    rewards: [
      { type: 'Investment Bonus', amount: 25 },
      { type: 'Portfolio Review', amount: 25 },
    ],
    isProOnly: true,
    difficulty: 'intermediate',
  },
  {
    id: '6',
    title: 'E-commerce Launch',
    description: 'Launch an online store and make your first sale',
    category: 'E-commerce',
    target: 100,
    duration: 30,
    participants: 289,
    startDate: '2024-03-15',
    endDate: '2024-04-15',
    progress: 15,
    rewards: [
      { type: 'First Sale', amount: 50 },
      { type: 'Store Setup', amount: 30 },
    ],
    isProOnly: false,
    difficulty: 'beginner',
  },
  {
    id: '7',
    title: 'Consulting Challenge',
    description: 'Land your first consulting client and earn $500',
    category: 'Consulting',
    target: 500,
    duration: 45,
    participants: 167,
    startDate: '2024-03-10',
    endDate: '2024-04-25',
    progress: 40,
    rewards: [
      { type: 'Client Bonus', amount: 100 },
      { type: 'Contract Review', amount: 50 },
    ],
    isProOnly: true,
    difficulty: 'advanced',
  },
  {
    id: '8',
    title: 'App Development Sprint',
    description: 'Build and launch a simple app with $300 in revenue',
    category: 'Development',
    target: 300,
    duration: 60,
    participants: 134,
    startDate: '2024-03-01',
    endDate: '2024-04-30',
    progress: 25,
    rewards: [
      { type: 'Launch Bonus', amount: 75 },
      { type: 'Tech Support', amount: 50 },
    ],
    isProOnly: true,
    difficulty: 'advanced',
  },
];

export async function GET() {
  try {
    // During development, we'll allow access without authentication
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(challenges);
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(challenges);
  } catch (error) {
    console.error('[CHALLENGES_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

const createChallengeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  target: z.number().positive(),
  duration: z.number().int().min(1).max(365),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  isProOnly: z.boolean().optional().default(false),
  rewards: z
    .array(
      z.object({
        type: z.string().min(1),
        amount: z.number().nonnegative(),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const body = await request.json();
    const parsed = createChallengeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid challenge payload' }, { status: 400 });
    }

    const now = new Date();
    const startDate = now.toISOString().slice(0, 10);
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + parsed.data.duration);

    const createdChallenge = {
      id: `challenge_${Date.now()}`,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      target: parsed.data.target,
      duration: parsed.data.duration,
      participants: 1,
      startDate,
      endDate: endDate.toISOString().slice(0, 10),
      progress: 0,
      rewards: parsed.data.rewards,
      isProOnly: parsed.data.isProOnly,
      difficulty: parsed.data.difficulty,
    };

    return NextResponse.json(createdChallenge, { status: 201 });
  } catch (error) {
    console.error('[CHALLENGES_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
