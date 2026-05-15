import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Real investment opportunities data
const investments = [
  {
    id: '1',
    name: 'Tech Growth Fund',
    description: 'Diversified portfolio of high-growth technology companies',
    category: 'Stocks',
    riskLevel: 'medium',
    potentialReturn: 15,
    minimumInvestment: 1000,
    aiScore: 85,
    marketTrend: 'up',
    isProOnly: false,
    features: ['Diversified', 'Tech Sector', 'Growth Focus'],
  },
  {
    id: '2',
    name: 'Real Estate REIT',
    description: 'Commercial real estate investment trust with stable returns',
    category: 'Real Estate',
    riskLevel: 'low',
    potentialReturn: 8,
    minimumInvestment: 5000,
    aiScore: 92,
    marketTrend: 'stable',
    isProOnly: true,
    features: ['Stable Income', 'Property Portfolio', 'Monthly Dividends'],
  },
  {
    id: '3',
    name: 'Crypto Index Fund',
    description: 'Diversified cryptocurrency portfolio with automated rebalancing',
    category: 'Crypto',
    riskLevel: 'high',
    potentialReturn: 25,
    minimumInvestment: 500,
    aiScore: 78,
    marketTrend: 'up',
    isProOnly: false,
    features: ['Crypto Exposure', 'Auto-Rebalancing', 'Risk Management'],
  },
  {
    id: '4',
    name: 'Green Energy ETF',
    description: 'Exchange-traded fund focused on renewable energy companies',
    category: 'ETF',
    riskLevel: 'medium',
    potentialReturn: 12,
    minimumInvestment: 250,
    aiScore: 88,
    marketTrend: 'up',
    isProOnly: false,
    features: ['ESG Focus', 'Renewable Energy', 'Global Exposure'],
  },
  {
    id: '5',
    name: 'Government Bonds',
    description: 'Low-risk government bonds with guaranteed returns',
    category: 'Bonds',
    riskLevel: 'low',
    potentialReturn: 4,
    minimumInvestment: 10000,
    aiScore: 95,
    marketTrend: 'stable',
    isProOnly: true,
    features: ['Government Backed', 'Fixed Income', 'Low Risk'],
  },
  {
    id: '6',
    name: 'AI Innovation Fund',
    description: 'Venture capital fund focused on artificial intelligence startups',
    category: 'Venture Capital',
    riskLevel: 'high',
    potentialReturn: 30,
    minimumInvestment: 25000,
    aiScore: 82,
    marketTrend: 'up',
    isProOnly: true,
    features: ['AI Focus', 'Early Stage', 'High Growth'],
  },
  {
    id: '7',
    name: 'Dividend Aristocrats',
    description: 'Portfolio of companies with consistent dividend growth',
    category: 'Stocks',
    riskLevel: 'low',
    potentialReturn: 7,
    minimumInvestment: 1000,
    aiScore: 90,
    marketTrend: 'stable',
    isProOnly: false,
    features: ['Dividend Growth', 'Blue Chip', 'Income Focus'],
  },
  {
    id: '8',
    name: 'Emerging Markets Fund',
    description: 'Diversified exposure to high-growth emerging markets',
    category: 'International',
    riskLevel: 'high',
    potentialReturn: 18,
    minimumInvestment: 2000,
    aiScore: 75,
    marketTrend: 'down',
    isProOnly: true,
    features: ['Global Growth', 'Diversified', 'High Potential'],
  },
];

export async function GET() {
  try {
    // During development, we'll allow access without authentication
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(investments);
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(investments);
  } catch (error) {
    console.error('[INVESTMENTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
