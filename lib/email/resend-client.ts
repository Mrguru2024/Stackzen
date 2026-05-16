import { Resend } from 'resend';

/** Avoid constructing Resend at module load when `RESEND_API_KEY` is unset (e.g. CI / local build). */
export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}
