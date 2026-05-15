import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('code_verifier')?.value;

  if (!codeVerifier) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=No code verifier found`);
  }

  try {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid session`);
    }

    // Clear the code verifier cookie
    cookieStore.delete('code_verifier');

    // Redirect to dashboard with success message
    return NextResponse.redirect(`${requestUrl.origin}/dashboard?success=Login successful`);
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Authentication failed`);
  }
}
