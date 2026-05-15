import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(req: NextRequest) {
  const { pathname } = new URL(req.url);
  if (pathname.endsWith('/favorites')) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    return NextResponse.json(user?.favoriteGigIds || []);
  }
  // Default: return all gigs
  const gigs = await prisma.gig.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(gigs);
}

export async function POST(req: NextRequest) {
  const { pathname } = new URL(req.url);
  if (pathname.endsWith('/favorites')) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { gigId } = await req.json();
    if (!gigId) return NextResponse.json({ error: 'Missing gigId' }, { status: 400 });
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { favoriteGigIds: { push: gigId } },
    });
    return NextResponse.json(user.favoriteGigIds);
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(req: NextRequest) {
  const { pathname } = new URL(req.url);
  if (pathname.endsWith('/favorites')) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { gigId } = await req.json();
    if (!gigId) return NextResponse.json({ error: 'Missing gigId' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const updated = await prisma.user.update({
      where: { email: session.user.email },
      data: { favoriteGigIds: user.favoriteGigIds.filter(id => id !== gigId) },
    });
    return NextResponse.json(updated.favoriteGigIds);
  }
  // Default: admin delete gig
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const data = await req.json();
  if (!data.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  await prisma.gig.delete({ where: { id: data.id } });
  return NextResponse.json({ success: true });
}
