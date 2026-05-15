import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { normalizeCountryName } from '@/lib/utils/format';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const country = searchParams.get('country');
    const state = searchParams.get('state');

    const where: any = {};
    if (category) {
      where.category = {
        equals: category.trim(),
        mode: 'insensitive',
      };
    }
    if (country) {
      where.location = where.location || {};
      where.location.contains = country.trim();
      where.location.mode = 'insensitive';
    }
    if (state) {
      where.location = where.location || {};
      const locParts = [country, state]
        .filter((s): s is string => typeof s === 'string' && s.length > 0)
        .map(s => s.trim());
      where.location.contains = locParts.join(', ');
      where.location.mode = 'insensitive';
    }

    const total = await prisma.gig.count({ where });
    const gigs = await prisma.gig.findMany({
      where,
      orderBy: { postedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Map gig properties to match frontend expectations
    const mappedGigs = gigs.map(gig => ({
      id: gig.id,
      title: gig.title,
      description: gig.description,
      url: gig.link,
      source: gig.source,
      category: gig.category,
      postedAt: gig.postedAt,
      expiresAt: gig.expiresAt,
      createdAt: gig.createdAt,
      updatedAt: gig.updatedAt,
      tradeType: gig.tradeType,
      location: gig.location,
      // add any other fields needed by the frontend
    }));

    // Debug logging
    console.log(
      '[API /api/gigs] Filters:',
      { category, country, state },
      '| Gigs returned:',
      mappedGigs.length
    );

    return NextResponse.json({
      gigs: mappedGigs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/gigs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gigs', details: error?.message },
      { status: 500 }
    );
  }
}

// New endpoint: /api/gigs/filters
export async function GET_FILTERS() {
  try {
    // Fetch all locations from gigs
    const gigs = await prisma.gig.findMany({ select: { location: true } });
    const countries = new Set<string>();
    const states = new Set<string>();
    for (const gig of gigs) {
      if (!gig.location) continue;
      const parts = gig.location.split(',').map((p: string) => p.trim());
      if (parts.length > 1) {
        // Assume last part is country
        const country = normalizeCountryName(parts[parts.length - 1]);
        countries.add(country);
        if (parts.length > 2) {
          // Assume second to last is state
          states.add(parts[parts.length - 2]);
        }
      } else if (parts.length === 1) {
        const country = normalizeCountryName(parts[0]);
        countries.add(country);
      }
    }
    return NextResponse.json({
      countries: Array.from(countries).filter(Boolean).sort(),
      states: Array.from(states).filter(Boolean).sort(),
    });
  } catch (error: any) {
    console.error('Error in /api/gigs/filters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gig filters', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Basic validation with specific error messages
    if (!data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!data.description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!data.category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    const link =
      typeof data.link === 'string' && data.link.length > 0
        ? data.link
        : `https://stackzen.app/g/${crypto.randomUUID()}`;

    const gig = await prisma.gig.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description ?? null,
        link,
        source: typeof data.source === 'string' ? data.source : 'user',
        category: data.category,
        tradeType: typeof data.tradeType === 'string' ? data.tradeType : 'general',
        location: typeof data.location === 'string' ? data.location : null,
      },
    });

    return NextResponse.json(gig, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/gigs:', error);
    return NextResponse.json(
      { error: 'Failed to create gig', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    if (!data.id) {
      return NextResponse.json({ error: 'Missing gig id' }, { status: 400 });
    }

    const updated = await prisma.gig.updateMany({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description ?? null,
        category: data.category,
        tradeType: data.tradeType ?? undefined,
        location: data.location ?? undefined,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    const gig = await prisma.gig.findUnique({ where: { id: data.id } });
    return NextResponse.json(gig);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update gig', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const data = await req.json();
    if (!data.id) {
      return NextResponse.json({ error: 'Missing gig id' }, { status: 400 });
    }

    const del = await prisma.gig.deleteMany({ where: { id: data.id } });
    if (del.count === 0) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete gig', details: error?.message },
      { status: 500 }
    );
  }
}
