import { NextResponse } from 'next/server';
import { aggregateAndStoreGigs } from '@/lib/aggregation/gig-sources';

export async function POST() {
  try {
    const gigs = await aggregateAndStoreGigs();
    return NextResponse.json({ success: true, count: gigs.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || error }, { status: 500 });
  }
}
