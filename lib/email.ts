import { AccountDeletionEmail } from '@/emails/account-deletion';
import { differenceInDays } from 'date-fns';
import { getResendClient } from '@/lib/email/resend-client';

export async function sendDeletionNotification(
  email: string,
  username: string,
  deletionDate: Date
) {
  const daysRemaining = differenceInDays(deletionDate, new Date());
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY missing; skipping deletion notification to', email);
    return;
  }

  try {
    await resend.emails.send({
      from: 'StackZen <noreply@stackzen.com>',
      to: email,
      subject: `Your StackZen account will be deleted in ${daysRemaining} days`,
      react: AccountDeletionEmail({
        username,
        deletionDate,
        daysRemaining,
      }),
    });
  } catch (error) {
    console.error('Failed to send deletion notification:', error);
    throw error;
  }
}

export async function sendDeletionConfirmation(
  email: string,
  username: string,
  deletionDate: Date
) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY missing; skipping deletion confirmation to', email);
    return;
  }

  try {
    await resend.emails.send({
      from: 'StackZen <noreply@stackzen.com>',
      to: email,
      subject: 'Your StackZen account has been scheduled for deletion',
      react: AccountDeletionEmail({
        username,
        deletionDate,
        daysRemaining: 30,
      }),
    });
  } catch (error) {
    console.error('Failed to send deletion confirmation:', error);
    throw error;
  }
}

export async function sendRecoveryConfirmation(email: string, username: string) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[email] RESEND_API_KEY missing; skipping recovery confirmation to', email);
    return;
  }

  try {
    await resend.emails.send({
      from: 'StackZen <noreply@stackzen.com>',
      to: email,
      subject: 'Your StackZen account has been recovered',
      react: AccountDeletionEmail({
        username,
        deletionDate: new Date(),
        daysRemaining: 0,
      }),
    });
  } catch (error) {
    console.error('Failed to send recovery confirmation:', error);
    throw error;
  }
}
