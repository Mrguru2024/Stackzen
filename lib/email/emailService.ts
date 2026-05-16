import type { Mentor, MentorSession, User } from '@prisma/client';
import { getResendClient } from '@/lib/email/resend-client';

type SessionEmailPayload = MentorSession & {
  user: Pick<User, 'name' | 'email'> | null;
  mentor: Mentor & { user: Pick<User, 'name'> | null };
};

async function sendHtml(to: string, subject: string, html: string) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[emailService] RESEND_API_KEY missing; skipping send to', to);
    return;
  }
  await resend.emails.send({
    from: 'StackZen <noreply@stackzen.com>',
    to,
    subject,
    html,
  });
}

export const emailService = {
  async sendSessionConfirmation(
    to: string,
    userName: string,
    mentorName: string,
    session: SessionEmailPayload
  ) {
    await sendHtml(
      to,
      'Mentor session confirmed',
      `<p>Hi ${escapeHtml(userName)},</p><p>Your session with ${escapeHtml(mentorName)} is confirmed.</p><p>Scheduled: ${escapeHtml(session.scheduledAt.toISOString())}</p>`
    );
  },

  async sendSessionReminder(
    to: string,
    userName: string,
    mentorName: string,
    session: SessionEmailPayload
  ) {
    await sendHtml(
      to,
      'Mentor session reminder',
      `<p>Hi ${escapeHtml(userName)},</p><p>Reminder: upcoming session with ${escapeHtml(mentorName)}.</p><p>Scheduled: ${escapeHtml(session.scheduledAt.toISOString())}</p>`
    );
  },

  async sendSessionCompleted(
    to: string,
    userName: string,
    mentorName: string,
    session: SessionEmailPayload
  ) {
    await sendHtml(
      to,
      'Mentor session completed',
      `<p>Hi ${escapeHtml(userName)},</p><p>Your session with ${escapeHtml(mentorName)} is marked complete.</p><p>Session id: ${escapeHtml(session.id)}</p>`
    );
  },

  async sendMentorApplicationReceived(to: string, mentorName: string, mentorId: string) {
    await sendHtml(
      to,
      'Mentor application received',
      `<p>Hi ${escapeHtml(mentorName)},</p><p>We received your mentor application (id ${escapeHtml(mentorId)}).</p>`
    );
  },

  async sendMentorApplicationApproved(to: string, mentorName: string, nextStepsHtml: string) {
    await sendHtml(
      to,
      'Mentor application approved',
      `<p>Hi ${escapeHtml(mentorName)},</p><p>Your mentor application was approved.</p>${nextStepsHtml}`
    );
  },
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
