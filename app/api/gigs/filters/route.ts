import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeCountryName } from '@/lib/utils/format';

export async function GET() {
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
