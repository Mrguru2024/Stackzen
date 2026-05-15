import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

function buildDailyStats(days: number) {
  const now = new Date();
  return Array.from({ length: days }).map((_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - index - 1));
    const clicks = 20 + ((index * 7) % 35);
    const conversions = Math.max(1, Math.floor(clicks * 0.08));
    const earnings = conversions * (15 + (index % 6));
    return {
      date: date.toISOString().slice(0, 10),
      clicks,
      conversions,
      earnings,
    };
  });
}

const programStats = [
  { program: 'Amazon Associates', clicks: 421, conversions: 38, earnings: 612 },
  { program: 'Shopify Partners', clicks: 236, conversions: 19, earnings: 1840 },
  { program: 'Udemy Affiliate', clicks: 112, conversions: 9, earnings: 289 },
];

export async function GET(request: Request) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') ?? '30d';
    const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const dailyStats = buildDailyStats(days);

    const conversionRates = programStats.map(stat => ({
      program: stat.program,
      rate: stat.clicks > 0 ? Number(((stat.conversions / stat.clicks) * 100).toFixed(2)) : 0,
    }));

    const topPerformingLinks = [
      {
        program: 'Shopify Partners',
        link: 'https://example.com/ref/shopify-partners',
        clicks: 236,
        conversions: 19,
        earnings: 1840,
      },
      {
        program: 'Amazon Associates',
        link: 'https://example.com/ref/amazon-associates',
        clicks: 421,
        conversions: 38,
        earnings: 612,
      },
      {
        program: 'Udemy Affiliate',
        link: 'https://example.com/ref/udemy-affiliate',
        clicks: 112,
        conversions: 9,
        earnings: 289,
      },
    ];

    return NextResponse.json({
      dailyStats,
      programStats,
      conversionRates,
      topPerformingLinks,
    });
  } catch (error) {
    console.error('[AFFILIATE_ANALYTICS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
