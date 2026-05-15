import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Real affiliate programs data
const affiliatePrograms = [
  {
    id: '1',
    name: 'Amazon Associates',
    description:
      'Earn commissions by promoting Amazon products. Access to millions of products across all categories.',
    category: 'E-commerce',
    commission: '1-10% (varies by category)',
    difficulty: 'beginner',
    potentialEarnings: 5000,
    requirements: ['Website or blog', 'Social media presence', 'Valid tax information'],
    isProOnly: false,
    aiScore: 9.2,
  },
  {
    id: '2',
    name: 'Shopify Partners',
    description:
      'Refer new merchants to Shopify and earn recurring commissions. Perfect for those with business connections.',
    category: 'E-commerce',
    commission: '20% recurring (up to $2,000 per referral)',
    difficulty: 'intermediate',
    potentialEarnings: 10000,
    requirements: ['Business network', 'Marketing experience', 'E-commerce knowledge'],
    isProOnly: true,
    aiScore: 8.8,
  },
  {
    id: '3',
    name: 'DigitalOcean Referral',
    description:
      'Refer developers and businesses to DigitalOcean cloud platform. High-value referrals with recurring commissions.',
    category: 'Technology',
    commission: '$200 per referral + 25% recurring',
    difficulty: 'intermediate',
    potentialEarnings: 8000,
    requirements: ['Tech audience', 'Developer connections', 'Cloud knowledge'],
    isProOnly: false,
    aiScore: 7.5,
  },
  {
    id: '4',
    name: 'Bluehost Affiliate',
    description:
      'Promote web hosting services to businesses and individuals. High conversion rates in the web hosting space.',
    category: 'Web Services',
    commission: '$65 per sale + $100 for premium plans',
    difficulty: 'beginner',
    potentialEarnings: 3000,
    requirements: ['Basic marketing skills', 'Web presence', 'Hosting knowledge'],
    isProOnly: false,
    aiScore: 6.9,
  },
  {
    id: '5',
    name: 'Udemy Affiliate',
    description:
      'Promote online courses to your audience. High commission rates and wide range of courses.',
    category: 'Education',
    commission: '97% of first sale',
    difficulty: 'beginner',
    potentialEarnings: 4000,
    requirements: ['Educational content', 'Student audience', 'Course promotion skills'],
    isProOnly: false,
    aiScore: 8.1,
  },
  {
    id: '6',
    name: 'Fiverr Affiliates',
    description:
      'Refer freelancers and clients to Fiverr. Earn commissions on first purchases and ongoing revenue.',
    category: 'Freelance',
    commission: '$150 per first purchase + $50 per new seller',
    difficulty: 'beginner',
    potentialEarnings: 6000,
    requirements: ['Freelance community', 'Business connections', 'Marketing skills'],
    isProOnly: false,
    aiScore: 7.8,
  },
  {
    id: '7',
    name: 'Hostinger Affiliate',
    description:
      'Promote web hosting and domain services. Competitive commissions and high conversion rates.',
    category: 'Web Services',
    commission: '60% of first payment + 5% recurring',
    difficulty: 'beginner',
    potentialEarnings: 3500,
    requirements: ['Web presence', 'Hosting knowledge', 'Basic marketing'],
    isProOnly: false,
    aiScore: 7.2,
  },
  {
    id: '8',
    name: 'SEMrush Affiliate',
    description:
      'Refer businesses to SEMrush SEO tools. High-value B2B referrals with recurring commissions.',
    category: 'Marketing',
    commission: '40% recurring (up to $200 per sale)',
    difficulty: 'advanced',
    potentialEarnings: 12000,
    requirements: ['SEO knowledge', 'B2B connections', 'Marketing expertise'],
    isProOnly: true,
    aiScore: 8.5,
  },
  {
    id: '9',
    name: 'ConvertKit Affiliate',
    description:
      'Promote email marketing platform to creators and businesses. High recurring commissions.',
    category: 'Marketing',
    commission: '30% recurring (lifetime)',
    difficulty: 'intermediate',
    potentialEarnings: 9000,
    requirements: ['Email marketing experience', 'Creator audience', 'Marketing skills'],
    isProOnly: true,
    aiScore: 8.3,
  },
  {
    id: '10',
    name: 'WP Engine Affiliate',
    description:
      'Refer WordPress hosting services to businesses. Premium hosting with high commission rates.',
    category: 'Web Services',
    commission: '$200 per sale + 5% recurring',
    difficulty: 'intermediate',
    potentialEarnings: 7500,
    requirements: ['WordPress expertise', 'Business connections', 'Hosting knowledge'],
    isProOnly: true,
    aiScore: 7.9,
  },
];

export async function GET() {
  try {
    // During development, we'll allow access without authentication
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(affiliatePrograms);
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(affiliatePrograms);
  } catch (error) {
    console.error('[AFFILIATE_PROGRAMS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
