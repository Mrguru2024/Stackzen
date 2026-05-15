import { Resend } from 'resend';
import type { SpendingGuardrail } from '@/lib/types/financial-wellness';
import { _formatCurrency as formatCurrency } from '@/lib/utils/format';
import { prisma } from '@/lib/prisma';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type NotificationType = 'email' | 'push' | 'in-app';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export class NotificationService {
  static async sendNotification(payload: NotificationPayload) {
    try {
      switch (payload.type) {
        case 'email':
          await this.sendEmail(payload);
          break;
        case 'push':
          await this.sendPushNotification(payload);
          break;
        case 'in-app':
          await this.createInAppNotification(payload);
          break;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  private static async sendEmail(payload: NotificationPayload) {
    if (!resend) return;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true },
    });
    const to = user?.email;
    if (!to) return;

    const { title, message } = payload;

    await resend.emails.send({
      from: 'StackZen <notifications@stackzen.com>',
      to,
      subject: title,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${title}</h2>
          <p style="color: #666;">${message}</p>
          <div style="margin-top: 20px; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
            <p style="margin: 0;">View your spending limits and manage your budget at:</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/financial-wellness"
               style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
              View Dashboard
            </a>
          </div>
        </div>
      `,
    });
  }

  private static async sendPushNotification(_payload: NotificationPayload) {
    // Implement push notification logic here
  }

  private static async createInAppNotification(payload: NotificationPayload) {
    // No Notification table in Prisma schema yet; avoid runtime errors until Phase 2.
    console.info('[notification] in-app skipped:', payload.title);
  }

  static async checkSpendingGuardrails(guardrail: SpendingGuardrail) {
    if (!guardrail.notifications || guardrail.limit <= 0) return;

    const percentage = (guardrail.current / guardrail.limit) * 100;
    const user = await prisma.user.findUnique({
      where: { id: guardrail.userId },
      include: { settings: true },
    });

    if (!user?.settings) return;

    if (percentage >= 100) {
      await this.sendNotification({
        userId: guardrail.userId,
        type: 'email',
        title: 'Spending Limit Exceeded',
        message: `You have exceeded your ${guardrail.period} spending limit of ${formatCurrency(guardrail.limit)} for ${guardrail.category}.`,
        data: { guardrailId: guardrail.id },
      });
    } else if (percentage >= 90) {
      await this.sendNotification({
        userId: guardrail.userId,
        type: 'email',
        title: 'Approaching Spending Limit',
        message: `You are approaching your ${guardrail.period} spending limit of ${formatCurrency(guardrail.limit)} for ${guardrail.category}. You have spent ${formatCurrency(guardrail.current)} so far.`,
        data: { guardrailId: guardrail.id },
      });
    }
  }
}
