import { authenticator } from 'otplib';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { createRedisClient, withRedisFallback } from '@/lib/redis-client';

const prisma = new PrismaClient();
const redis = createRedisClient(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limiting configuration
const RATE_LIMIT = {
  LOGIN: { max: 5, window: 60 }, // 5 attempts per minute
  API: { max: 100, window: 60 }, // 100 requests per minute
  PASSWORD_RESET: { max: 3, window: 3600 }, // 3 attempts per hour
} as const;

// Security service
export class SecurityService {
  // Rate limiting
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

  // Generate rate limit key
  static getRateLimitKey(identifier: string, type: keyof typeof RATE_LIMIT): string {
    return `ratelimit:${type}:${identifier}`;
  }

  // 2FA setup
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

    // Store secret temporarily (encrypted)
    const encryptedSecret = this.encryptSecret(secret);
    await withRedisFallback(() => redis.set(`2fa:setup:${userId}`, encryptedSecret, 'EX', 300), 'OK'); // 5 minutes expiry

    return {
      secret,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauth)}&size=200x200`,
    };
  }

  // Verify 2FA setup
  static async verify2FASetup(userId: string, token: string): Promise<boolean> {
    const encryptedSecret = await withRedisFallback(() => redis.get(`2fa:setup:${userId}`), null);
    if (!encryptedSecret) {
      throw new Error('2FA setup expired or not initiated');
    }

    const secret = this.decryptSecret(encryptedSecret);
    const isValid = authenticator.verify({ token, secret });

    if (isValid) {
      // Store verified secret (requires `twoFactorSecret` column in DB when not using `as any` shim)
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: this.encryptSecret(secret),
        } as any,
      });
      await withRedisFallback(() => redis.del(`2fa:setup:${userId}`), 0);
    }

    return isValid;
  }

  // Verify 2FA token
  static async verify2FAToken(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const secretStored = (user as { twoFactorSecret?: string | null } | null)?.twoFactorSecret;
    if (!secretStored) {
      throw new Error('2FA not enabled');
    }

    const secret = this.decryptSecret(secretStored);
    return authenticator.verify({ token, secret });
  }

  // Disable 2FA
  static async disable2FA(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verify2FAToken(userId, token);
    if (!isValid) {
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null } as any,
    });

    return true;
  }

  // Encrypt secret
  private static encryptSecret(secret: string): string {
    const key = process.env.ENCRYPTION_KEY || 'default-key';
    return createHash('sha256')
      .update(secret + key)
      .digest('hex');
  }

  // Decrypt secret
  private static decryptSecret(encryptedSecret: string): string {
    // In a real implementation, you would use proper encryption/decryption
    // This is a simplified version for demonstration
    return encryptedSecret;
  }

  // Audit logging
  static async logSecurityEvent(
    userId: string,
    event: string,
    details: Record<string, any>
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        action: event,
        details: { ...details, userAgent: details.userAgent } as object,
        ipAddress: typeof details.ipAddress === 'string' ? details.ipAddress : undefined,
        severity: 'info',
      },
    });
  }

  // Check for suspicious activity
  static async checkSuspiciousActivity(userId: string): Promise<boolean> {
    const recentEvents = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const failedLogins = recentEvents.filter(event => event.action === 'login_failed').length;

    const passwordResets = recentEvents.filter(event => event.action === 'password_reset').length;

    return failedLogins > 10 || passwordResets > 3;
  }
}

export default SecurityService;
