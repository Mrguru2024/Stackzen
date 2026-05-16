import { authenticator } from 'otplib';
import { RedisEdge } from '../redis-edge';
import QRCode from 'qrcode';

export class TwoFactorAuth {
  private static instance: TwoFactorAuth;

  private constructor() {
    // Configure TOTP
    authenticator.options = {
      window: 1, // Allow 1 window before and after for clock skew
      step: 30, // 30 seconds per code
    };
  }

  static getInstance(): TwoFactorAuth {
    if (!TwoFactorAuth.instance) {
      TwoFactorAuth.instance = new TwoFactorAuth();
    }
    return TwoFactorAuth.instance;
  }

  // This method is only used in API routes, not middleware
  async setup(userId: string): Promise<{ secret: string; qrCode: string }> {
    // Generate secret
    const secret = authenticator.generateSecret();

    // Store secret temporarily in Redis (expires in 10 minutes)
    await RedisEdge.set(`2fa:setup:${userId}`, secret, 600);

    // Generate QR code
    const otpauth = authenticator.keyuri(userId, 'StackZen', secret);
    const qrCode = await QRCode.toDataURL(otpauth);

    return { secret, qrCode };
  }

  // This method is only used in API routes, not middleware
  async verifySetup(userId: string, token: string): Promise<boolean> {
    const secret = await RedisEdge.get(`2fa:setup:${userId}`);
    if (!secret) {
      throw new Error('2FA setup expired or not initiated');
    }

    const isValid = authenticator.verify({ token, secret });
    if (isValid) {
      // Store 2FA status in Redis
      await RedisEdge.set(`2fa:enabled:${userId}`, 'true', 30 * 24 * 60 * 60); // 30 days
      await RedisEdge.set(`2fa:secret:${userId}`, secret, 30 * 24 * 60 * 60); // 30 days
      // Clear temporary secret
      await RedisEdge.del(`2fa:setup:${userId}`);
    }

    return isValid;
  }

  // This method is used in middleware
  async verify(userId: string, token: string): Promise<boolean> {
    const [enabled, secret] = await Promise.all([
      RedisEdge.get(`2fa:enabled:${userId}`),
      RedisEdge.get(`2fa:secret:${userId}`),
    ]);

    if (!enabled || !secret) {
      return false;
    }

    return authenticator.verify({ token, secret });
  }

  // This method is only used in API routes, not middleware
  async disable(userId: string, token: string): Promise<boolean> {
    const secret = await RedisEdge.get(`2fa:secret:${userId}`);
    if (!secret) {
      throw new Error('2FA not enabled for this user');
    }

    const isValid = authenticator.verify({ token, secret });
    if (isValid) {
      await Promise.all([
        RedisEdge.del(`2fa:enabled:${userId}`),
        RedisEdge.del(`2fa:secret:${userId}`),
        RedisEdge.del(`2fa:backup:${userId}`),
      ]);
    }

    return isValid;
  }

  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 15).toUpperCase()
    );

    // Store backup codes in Redis (expires in 30 days)
    await RedisEdge.set(`2fa:backup:${userId}`, JSON.stringify(codes), 30 * 24 * 60 * 60);

    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const storedCodes = await RedisEdge.get(`2fa:backup:${userId}`);
    if (!storedCodes) {
      throw new Error('No backup codes found');
    }

    const codes = JSON.parse(storedCodes) as string[];
    const index = codes.indexOf(code);

    if (index === -1) {
      return false;
    }

    // Remove used code
    codes.splice(index, 1);
    await RedisEdge.set(`2fa:backup:${userId}`, JSON.stringify(codes), 30 * 24 * 60 * 60);

    return true;
  }

  // This method is used in middleware
  async getStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
  }> {
    const [enabled, backupCodes] = await Promise.all([
      RedisEdge.get(`2fa:enabled:${userId}`),
      RedisEdge.get(`2fa:backup:${userId}`),
    ]);

    const backupCodesRemaining = backupCodes ? (JSON.parse(backupCodes) as string[]).length : 0;

    return {
      enabled: enabled === 'true',
      backupCodesRemaining,
    };
  }
}
