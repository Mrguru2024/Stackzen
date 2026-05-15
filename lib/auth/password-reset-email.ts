import { Resend } from 'resend';

/** HTML body for prisma-token reset links (`/reset-password?token=`). */
export function buildPasswordResetEmailHtml(resetUrl: string, appName: string): string {
  return `
    <div style="font-family: system-ui,sans-serif; max-width: 560px; margin: 0 auto; line-height: 1.5;">
      <h2 style="color: #111;">Reset your password</h2>
      <p style="color: #444;">We received a request to reset your ${appName} password. Choose a button or link below.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background: #059669; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset password</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Or paste this URL into your browser (link expires in 1 hour):<br />
        <span style="word-break: break-all;">${resetUrl}</span>
      </p>
      <p style="color: #888; font-size: 13px;">
        If you did not ask for this, you can ignore this email.
      </p>
    </div>
  `;
}

export async function sendPrismaPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  appName?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromRaw = process.env.EMAIL_FROM?.trim();
  const from =
    fromRaw && fromRaw.includes('@')
      ? fromRaw
      : process.env.NODE_ENV === 'production'
        ? ''
        : 'StackZen Dev <onboarding@resend.dev>';

  const appName = params.appName ?? process.env.NEXT_PUBLIC_APP_NAME?.trim() ?? 'StackZen';

  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[password-reset] RESEND_API_KEY is not set — prisma password reset email was not sent.'
      );
      console.warn('[password-reset] Dev reset URL (do not ship in logs elsewhere):', params.resetUrl);
    }
    return { ok: false, reason: 'RESEND_API_KEY is not configured' };
  }

  if (!from) {
    return { ok: false, reason: 'EMAIL_FROM is required in production when using Resend' };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `${appName} password reset`,
    html: buildPasswordResetEmailHtml(params.resetUrl, appName),
  });

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[password-reset] Resend error:', error);
    }
    return { ok: false, reason: error.message ?? 'Resend rejected the message' };
  }

  return { ok: true };
}
