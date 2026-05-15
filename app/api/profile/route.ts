import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Sample profile data
const profile = {
  userId: 'google-1745767720544',
  personalInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, Suite 100\nSan Francisco, CA 94105',
    website: 'https://johndoe.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  businessInfo: {
    companyName: 'Doe Enterprises',
    industry: 'Technology',
    experienceLevel: 'intermediate',
    targetMargin: 30,
    businessGoals: [
      'increase_revenue',
      'retain_existing_clients',
      'expand_market_share',
      'improve_efficiency',
    ],
    businessChallenges: [
      'pricing_strategy',
      'finding_clients',
      'managing_costs',
      'scaling_operations',
    ],
    servicePreferences: [
      'value_oriented',
      'reliability_oriented',
      'quality_focused',
      'customer_centric',
    ],
  },
  subscription: {
    plan: 'pro',
    status: 'active',
    validUntil: '2024-12-31',
    features: [
      'Advanced Analytics',
      'Priority Support',
      'Custom Branding',
      'API Access',
      'Team Collaboration',
      'Advanced Security',
    ],
  },
  preferences: {
    notifications: {
      email: true,
      push: true,
      marketing: false,
    },
    privacy: {
      profileVisibility: 'public',
      showContactInfo: true,
      showBusinessInfo: true,
    },
  },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Allow access without authentication during development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(profile);
    }

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('[PROFILE_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();

    // In a real application, you would:
    // 1. Validate the incoming data
    // 2. Update the database
    // 3. Return the updated profile

    // For now, we'll just return the updated profile
    const updatedProfile = {
      ...profile,
      ...body,
    };

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('[PROFILE_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
