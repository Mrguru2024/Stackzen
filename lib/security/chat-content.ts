import {
  decryptSensitiveString,
  encryptSensitiveString,
  isEncryptedPayload,
} from '@/lib/security/encryption';

export function isChatContentEncryptionEnabled(): boolean {
  return process.env.ENCRYPT_CHAT_CONTENT === 'true';
}

export function encryptChatContent(plain: string): { content: string; isContentEncrypted: boolean } {
  if (!isChatContentEncryptionEnabled()) {
    return { content: plain, isContentEncrypted: false };
  }
  return {
    content: encryptSensitiveString(plain),
    isContentEncrypted: true,
  };
}

export function decryptChatContent(content: string, isContentEncrypted: boolean): string {
  if (!isContentEncrypted) {
    return content;
  }
  if (!isEncryptedPayload(content)) {
    return content;
  }
  return decryptSensitiveString(content);
}
