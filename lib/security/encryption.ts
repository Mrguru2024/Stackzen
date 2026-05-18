import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const IV_LENGTH = 12;
const MIN_KEY_LENGTH = 32;

export function isProductionEncryption(): boolean {
  return process.env.NODE_ENV === 'production';
}

function getBankEncryptionKey(): string | undefined {
  const key = process.env.BANK_TOKEN_ENCRYPTION_KEY?.trim();
  if (!key) return undefined;
  if (key.length < MIN_KEY_LENGTH) {
    throw new Error('BANK_TOKEN_ENCRYPTION_KEY must be at least 32 characters');
  }
  return key;
}

function getKeyMaterial(): string {
  const bankKey = getBankEncryptionKey();
  if (bankKey) return bankKey;

  if (isProductionEncryption()) {
    throw new Error(
      'BANK_TOKEN_ENCRYPTION_KEY is required in production (32+ characters). Do not use NEXTAUTH_SECRET for field encryption.'
    );
  }

  const devFallback = process.env.NEXTAUTH_SECRET?.trim();
  if (devFallback && devFallback.length >= MIN_KEY_LENGTH) {
    return devFallback;
  }

  return 'stackzen-dev-fallback-key-not-for-production';
}

/** Fail fast at startup when production lacks a dedicated encryption key. */
export function assertEncryptionKeyConfigured(): void {
  if (!isProductionEncryption()) return;
  getKeyMaterial();
}

function deriveKey(): Buffer {
  return createHash('sha256').update(getKeyMaterial()).digest();
}

export function encryptSensitiveString(value: string): string {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSensitiveString(payload: string): string {
  const [ivB64, tagB64, encryptedB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error('Invalid encrypted payload format');
  }

  const key = deriveKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function encryptJson<T>(value: T): string {
  return encryptSensitiveString(JSON.stringify(value));
}

export function decryptJson<T>(payload: string): T {
  const raw = decryptSensitiveString(payload);
  return JSON.parse(raw) as T;
}

export function isEncryptedPayload(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 3 && parts.every(p => p.length > 0);
}
