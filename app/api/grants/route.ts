import { NextResponse } from 'next/server';

/** Grants API is disabled until Funding Finder ships with live data sources. */
export async function GET() {
  return NextResponse.json(
    {
      status: 'coming_soon',
      message: 'Funding Finder is not available yet. Grant listings will return when the feature launches.',
    },
    { status: 503 }
  );
}
