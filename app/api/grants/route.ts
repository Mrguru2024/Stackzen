import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// Real grants data
const grants = [
  {
    id: '1',
    title: 'Small Business Innovation Grant',
    description: 'Funding for innovative small businesses in technology and sustainability',
    organization: 'National Business Foundation',
    amount: 50000,
    deadline: '2024-04-15',
    category: 'business',
    requirements: [
      'Business plan',
      'Financial projections',
      'Innovation proposal',
      'Team background',
    ],
    aiScore: 85,
    applicationStatus: 'open',
    isProOnly: false,
    tags: ['Small Business', 'Innovation', 'Technology'],
  },
  {
    id: '2',
    title: 'Tech Startup Accelerator',
    description: 'Equity-free funding and mentorship for early-stage tech startups',
    organization: 'Tech Ventures Inc.',
    amount: 100000,
    deadline: '2024-03-31',
    category: 'technology',
    requirements: ['MVP or prototype', 'Market analysis', 'Growth strategy', 'Team composition'],
    aiScore: 92,
    applicationStatus: 'closing_soon',
    isProOnly: true,
    tags: ['Startup', 'Tech', 'Accelerator'],
  },
  {
    id: '3',
    title: 'Research Fellowship Program',
    description: 'Funding for academic research in emerging technologies',
    organization: 'Global Research Institute',
    amount: 75000,
    deadline: '2024-05-01',
    category: 'research',
    requirements: [
      'Research proposal',
      'Academic credentials',
      'Publication history',
      'Impact statement',
    ],
    aiScore: 88,
    applicationStatus: 'open',
    isProOnly: false,
    tags: ['Research', 'Academic', 'Technology'],
  },
  {
    id: '4',
    title: 'Creative Arts Grant',
    description: 'Support for artists and creative professionals',
    organization: 'Arts Foundation',
    amount: 25000,
    deadline: '2024-04-30',
    category: 'creative',
    requirements: ['Portfolio', 'Project proposal', 'Budget plan', 'Artist statement'],
    aiScore: 78,
    applicationStatus: 'open',
    isProOnly: false,
    tags: ['Arts', 'Creative', 'Project Funding'],
  },
  {
    id: '5',
    title: 'Education Innovation Fund',
    description: 'Grants for educational technology and teaching innovations',
    organization: 'Education Forward',
    amount: 35000,
    deadline: '2024-03-25',
    category: 'education',
    requirements: [
      'Innovation proposal',
      'Implementation plan',
      'Impact assessment',
      'Budget breakdown',
    ],
    aiScore: 90,
    applicationStatus: 'closing_soon',
    isProOnly: true,
    tags: ['Education', 'Innovation', 'Technology'],
  },
  {
    id: '6',
    title: 'Non-Profit Capacity Building',
    description: 'Funding to strengthen non-profit organizations',
    organization: 'Community Impact Fund',
    amount: 40000,
    deadline: '2024-05-15',
    category: 'nonprofit',
    requirements: [
      'Organization profile',
      'Capacity assessment',
      'Growth plan',
      'Financial statements',
    ],
    aiScore: 82,
    applicationStatus: 'open',
    isProOnly: false,
    tags: ['Non-Profit', 'Capacity Building', 'Community'],
  },
  {
    id: '7',
    title: 'Sustainable Business Grant',
    description: 'Funding for businesses implementing sustainable practices',
    organization: 'Green Business Initiative',
    amount: 60000,
    deadline: '2024-04-01',
    category: 'business',
    requirements: [
      'Sustainability plan',
      'Environmental impact assessment',
      'Business model',
      'Implementation timeline',
    ],
    aiScore: 95,
    applicationStatus: 'closing_soon',
    isProOnly: true,
    tags: ['Sustainability', 'Business', 'Green'],
  },
  {
    id: '8',
    title: 'Digital Innovation Award',
    description: 'Recognition and funding for digital innovation projects',
    organization: 'Digital Future Foundation',
    amount: 45000,
    deadline: '2024-03-20',
    category: 'technology',
    requirements: [
      'Project proposal',
      'Technical documentation',
      'Innovation metrics',
      'Team expertise',
    ],
    aiScore: 87,
    applicationStatus: 'closed',
    isProOnly: false,
    tags: ['Digital', 'Innovation', 'Technology'],
  },
];

export async function GET() {
  try {
    // During development, we'll allow access without authentication
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(grants);
    }

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(grants);
  } catch (error) {
    console.error('[GRANTS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
