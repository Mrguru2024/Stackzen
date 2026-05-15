import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.redirect(`${req.nextUrl.origin}/login`);
  }

  const trialStatus =
    session.user.subscriptionLevel === 'PRO' || session.user.role === 'SUPER_ADMIN'
      ? 'pro'
      : 'active';
  const userRole = session.user.role || 'USER';

  const redirectPath = req.nextUrl.searchParams.get('redirect') || '/dashboard';
  const baseUrl = req.nextUrl.origin;
  const absoluteRedirectUrl = redirectPath.startsWith('http')
    ? redirectPath
    : `${baseUrl}${redirectPath}`;
  const response = NextResponse.redirect(absoluteRedirectUrl);
  response.cookies.set('trial-status', trialStatus, { path: '/', sameSite: 'lax' });
  response.cookies.set('user-role', userRole, { path: '/', sameSite: 'lax' });
  return response;
}
