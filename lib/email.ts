import { Resend } from 'resend';
import { AccountDeletionEmail } from '@/emails/account-deletion';
import { differenceInDays } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDeletionNotification(
  email: string,
  username: string,
  deletionDate: Date
) {
  const daysRemaining = differenceInDays(deletionDate, new Date());

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
