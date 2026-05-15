import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions as authOptions } from '@/lib/auth-config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id, email, name } = session.user;
    return NextResponse.json({ id, email, name });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
