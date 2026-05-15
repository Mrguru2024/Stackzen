import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { resolveOrCreateSupabaseAuthUserId } from '@/lib/supabase/sync-prisma-auth-user-id';
import { createCheckoutSession } from '@/lib/stripe/actions';
import { enforceApiRateLimit } from '@/lib/api/rate-limit-request';
import type { SubscriptionLevel } from '@prisma/client';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    email: z.string().email('Invalid email address').max(320),
    password: z.string().min(8, 'Password must be at least 8 characters').max(200),
    plan: z.string().max(32).optional(),
    cycle: z.string().max(16).optional(),
    country: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
  })
  .strict();

const allowedPlans = ['FREE', 'PRO', 'LIFETIME', 'ZEN_PLUS', 'COACHING_SESSION'] as const;
const allowedCycles = ['monthly', 'annual'] as const;

export async function POST(req: Request) {
  const limited = await enforceApiRateLimit(req, 'auth_signup', { strict: true });
  if (limited) return limited;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }

    const { name, email, password, plan, cycle, country, state } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    let subscriptionLevel: SubscriptionLevel = 'FREE';
    if (plan && allowedPlans.includes(plan.toUpperCase() as (typeof allowedPlans)[number])) {
      subscriptionLevel = plan.toUpperCase() as SubscriptionLevel;
    }
    let billingCycle: (typeof allowedCycles)[number] = 'monthly';
    if (cycle && allowedCycles.includes(cycle.toLowerCase() as (typeof allowedCycles)[number])) {
      billingCycle = cycle.toLowerCase() as (typeof allowedCycles)[number];
    }

    const now = new Date();
    const trialExpiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        subscriptionLevel,
        trialStartedAt: now,
        trialExpiresAt,
        isTrialActive: true,
        userSettings: {
          create: {
            theme: 'system',
            emailNotifications: true,
            pushNotifications: true,
            weeklyReports: true,
            goalReminders: true,
            challengeUpdates: true,
          },
        },
      },
    });

    const supabaseAuthId = await resolveOrCreateSupabaseAuthUserId({ email, password });
    if (supabaseAuthId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { authUserId: supabaseAuthId },
      });
    }

    if (subscriptionLevel !== 'FREE') {
      try {
        const checkoutSession = await createCheckoutSession({
          userId: user.id,
          email,
          plan: subscriptionLevel as 'PRO' | 'LIFETIME' | 'ZEN_PLUS' | 'COACHING_SESSION',
          cycle: billingCycle,
          country,
          state,
        });

        if (checkoutSession.url) {
          return NextResponse.json({ url: checkoutSession.url }, { status: 201 });
        }
        return NextResponse.json({ error: 'Could not create a payment session.' }, { status: 500 });
      } catch {
        console.error('Stripe session creation error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }

    await prisma.wellnessScore.create({
      data: {
        userId: user.id,
        totalScore: 0,
        status: 'At Risk',
        color: '#e53e3e',
        description:
          'Initial wellness score - complete your profile to get a personalized assessment',
        categoryScores: JSON.stringify({
          income: 0,
          savings: 0,
          debt: 0,
          emergency: 0,
          investments: 0,
          goals: 0,
        }),
      },
    });

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch {
    console.error('Signup error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
