import type { ReactElement } from 'react';
import { render } from '@react-email/render';
import { AccountDeletionEmail } from '@/emails/account-deletion';
import { differenceInDays } from 'date-fns';
import {
  getDefaultEmailFrom,
  isBrevoConfigured,
  sendTransactionalEmail,
} from '@/lib/email/send-email';

async function sendReactEmail(
  to: string,
  subject: string,
  element: ReactElement,
  from?: string
) {
  if (!isBrevoConfigured()) {
    console.warn('[email] BREVO_API_KEY missing; skipping send to', to);
    return;
  }
  const html = await render(element);
  const result = await sendTransactionalEmail({
    from: from ?? getDefaultEmailFrom(),
    to,
    subject,
    html,
  });
  if (!result.ok) {
    throw new Error(result.reason);
  }
}

export async function sendDeletionNotification(
  email: string,
  username: string,
  deletionDate: Date
) {
  const daysRemaining = differenceInDays(deletionDate, new Date());
  try {
    await sendReactEmail(
      email,
      `Your StackZen account will be deleted in ${daysRemaining} days`,
      AccountDeletionEmail({
        username,
        deletionDate,
        daysRemaining,
      })
    );
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
  try {
    await sendReactEmail(
      email,
      'Your StackZen account has been scheduled for deletion',
      AccountDeletionEmail({
        username,
        deletionDate,
        daysRemaining: 30,
      })
    );
  } catch (error) {
    console.error('Failed to send deletion confirmation:', error);
    throw error;
  }
}

export async function sendRecoveryConfirmation(email: string, username: string) {
  try {
    await sendReactEmail(
      email,
      'Your StackZen account has been recovered',
      AccountDeletionEmail({
        username,
        deletionDate: new Date(),
        daysRemaining: 0,
      })
    );
  } catch (error) {
    console.error('Failed to send recovery confirmation:', error);
    throw error;
  }
}
