import { headers } from 'next/headers';

export async function getRequestClientMeta(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() || h.get('x-real-ip')?.trim() || h.get('cf-connecting-ip') || 'unknown';
  const userAgent = h.get('user-agent') || 'unknown';
  return { ip, userAgent };
}
