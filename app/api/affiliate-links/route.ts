import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

const affiliateLinks = [
  {
    id: 'al_1',
    program: 'Amazon Associates',
    link: 'https://example.com/ref/amazon-associates',
    clicks: 421,
    conversions: 38,
    earnings: 612,
    status: 'active',
    createdAt: '2026-02-14T00:00:00.000Z',
  },
  {
    id: 'al_2',
    program: 'Shopify Partners',
    link: 'https://example.com/ref/shopify-partners',
    clicks: 236,
    conversions: 19,
    earnings: 1840,
    status: 'active',
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'al_3',
    program: 'Udemy Affiliate',
    link: 'https://example.com/ref/udemy-affiliate',
    clicks: 112,
    conversions: 9,
    earnings: 289,
    status: 'inactive',
    createdAt: '2025-11-20T00:00:00.000Z',
  },
];

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(affiliateLinks);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(affiliateLinks);
  } catch (error) {
    console.error('[AFFILIATE_LINKS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
