import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('test-cookie', 'test', { path: '/', sameSite: 'lax' });
  return response;
}
