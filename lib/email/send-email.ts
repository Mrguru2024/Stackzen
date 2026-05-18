import 'server-only';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export type EmailSender = { name: string; email: string };

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  /** Override default from `EMAIL_FROM` / `BREVO_SENDER_EMAIL` */
  from?: string;
};

export function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim());
}

/** Parses `Name <email@domain.com>` or plain `email@domain.com`. */
export function parseEmailFrom(raw: string): EmailSender {
  const trimmed = raw.trim();
  const angle = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (angle) {
    return { name: angle[1].trim(), email: angle[2].trim() };
  }
  return { name: process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'StackZen', email: trimmed };
}

export function getDefaultEmailFrom(): string {
  const from =
    process.env.EMAIL_FROM?.trim() ||
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    (process.env.NODE_ENV === 'production' ? '' : 'noreply@stackzen.com');
  return from;
}

export function resolveSender(fromOverride?: string): EmailSender | null {
  const raw = fromOverride?.trim() || getDefaultEmailFrom();
  if (!raw || !raw.includes('@')) {
    return null;
  }
  return parseEmailFrom(raw);
}

export async function sendTransactionalEmail(
  params: SendEmailParams
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, reason: 'BREVO_API_KEY is not configured' };
  }

  const sender = resolveSender(params.from);
  if (!sender) {
    return {
      ok: false,
      reason: 'EMAIL_FROM or BREVO_SENDER_EMAIL is required (verified sender in Brevo)',
    };
  }

  const recipients = (Array.isArray(params.to) ? params.to : [params.to]).map(email => ({
    email: email.trim(),
  }));

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: recipients,
      subject: params.subject,
      htmlContent: params.html,
    }),
  });

  if (!response.ok) {
    let reason = `Brevo API error (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) reason = body.message;
    } catch {
      // ignore parse errors
    }
    return { ok: false, reason };
  }

  return { ok: true };
}
