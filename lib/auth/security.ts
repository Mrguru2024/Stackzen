import { authenticator } from 'otplib';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createRedisClient, withRedisFallback } from '@/lib/redis-client';
import {
  decryptSensitiveString,
  encryptSensitiveString,
} from '@/lib/security/encryption';
import { AUDIT_ACTIONS } from '@/lib/security/audit-catalog';
import { writeAuditLog } from '@/lib/security/audit-log';

const redis = createRedisClient(process.env.REDIS_URL || 'redis://localhost:6379');

const RATE_LIMIT = {
  LOGIN: { max: 5, window: 60 },
  API: { max: 100, window: 60 },
  PASSWORD_RESET: { max: 3, window: 3600 },
} as const;

export class SecurityService {
  static async checkRateLimit(key: string, type: keyof typeof RATE_LIMIT): Promise<boolean> {
    const { max, window } = RATE_LIMIT[type];
    const current = await withRedisFallback(() => redis.incr(key), 0);

    if (current === 0) {
      return true;
    }

    if (current === 1) {
      await withRedisFallback(() => redis.expire(key, window), 0);
    }

    return current <= max;
  }

  static getRateLimitKey(identifier: string, type: keyof typeof RATE_LIMIT): string {
    return `ratelimit:${type}:${identifier}`;
  }

  static async setup2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = authenticator.generateSecret();
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.email) {
      throw new Error('User email is required for 2FA setup');
    }

    const otpauth = authenticator.keyuri(user.email, 'StackZen', secret);
    const encryptedSecret = encryptSensitiveString(secret);
    await withRedisFallback(() => redis.set(`2fa:setup:${userId}`, encryptedSecret, 'EX', 300), 'OK');

    return {
      secret,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauth)}&size=200x200`,
    };
  }

  static async verify2FASetup(userId: string, token: string): Promise<boolean> {
    const encryptedSecret = await withRedisFallback(() => redis.get(`2fa:setup:${userId}`), null);
    if (!encryptedSecret) {
      throw new Error('2FA setup expired or not initiated');
    }

    const secret = decryptSensitiveString(encryptedSecret);
    const isValid = authenticator.verify({ token, secret });

    if (isValid) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: encryptSensitiveString(secret),
        },
      });
      await withRedisFallback(() => redis.del(`2fa:setup:${userId}`), 0);
      await writeAuditLog({
        userId,
        action: AUDIT_ACTIONS.AUTH_2FA_ENABLED,
        severity: 'info',
      });
    }

    return isValid;
  }

  static async verify2FAToken(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA not enabled');
    }

    const secret = decryptSensitiveString(user.twoFactorSecret);
    return authenticator.verify({ token, secret });
  }

  static async disable2FA(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verify2FAToken(userId, token);
    if (!isValid) {
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    await writeAuditLog({
      userId,
      action: AUDIT_ACTIONS.AUTH_2FA_DISABLED,
      severity: 'warning',
    });

    return true;
  }

  static async logSecurityEvent(
    userId: string,
    event: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await writeAuditLog({
      userId,
      action: event,
      details: details as Prisma.InputJsonValue,
      ipAddress: typeof details.ipAddress === 'string' ? details.ipAddress : undefined,
      severity: 'info',
    });
  }

  static async checkSuspiciousActivity(userId: string): Promise<boolean> {
    const recentEvents = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const failedLogins = recentEvents.filter(event => event.action === 'auth.login_failed').length;
    const passwordResets = recentEvents.filter(event => event.action === 'password_reset').length;

    return failedLogins > 10 || passwordResets > 3;
  }
}

export default SecurityService;
