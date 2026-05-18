import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAiPrivacySettings, requireAiConsent } from '@/lib/ai/consent';
import { canPersistAiMemory } from '@/lib/ai/memory';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    userSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    chatMessage: { deleteMany: jest.fn() },
    aiInteractionLog: { create: jest.fn() },
  },
}));

jest.mock('@/lib/ai/chat-persistence', () => ({
  listChatMessagesForUser: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/lib/security/audit-log', () => ({
  writeAuditLog: jest.fn(),
}));

describe('AI consent and memory privacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requireAiConsent returns AI_CONSENT_REQUIRED without consent timestamp', async () => {
    (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
      aiConsentAt: null,
      aiMemoryEnabled: false,
      aiOptOut: false,
    });

    const blocked = await requireAiConsent('user-1');
    expect(blocked).toBeInstanceOf(NextResponse);
    expect(blocked?.status).toBe(403);
    const body = await blocked?.json();
    expect(body.code).toBe('AI_CONSENT_REQUIRED');
  });

  it('requireAiConsent returns AI_OPT_OUT when user opted out', async () => {
    (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
      aiConsentAt: new Date('2026-01-01'),
      aiMemoryEnabled: true,
      aiOptOut: true,
    });

    const blocked = await requireAiConsent('user-1');
    const body = await blocked?.json();
    expect(blocked?.status).toBe(403);
    expect(body.code).toBe('AI_OPT_OUT');
  });

  it('canPersistAiMemory is false when opted out even with consent', async () => {
    (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
      aiConsentAt: new Date('2026-01-01'),
      aiMemoryEnabled: true,
      aiOptOut: true,
    });

    expect(await canPersistAiMemory('user-1')).toBe(false);
  });

  it('canPersistAiMemory is true when consent granted and memory enabled', async () => {
    (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue({
      aiConsentAt: new Date('2026-01-01'),
      aiMemoryEnabled: true,
      aiOptOut: false,
    });

    expect(await canPersistAiMemory('user-1')).toBe(true);
  });

  it('getAiPrivacySettings defaults when row missing', async () => {
    (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);

    const settings = await getAiPrivacySettings('user-1');
    expect(settings.aiConsentAt).toBeNull();
    expect(settings.aiOptOut).toBe(false);
    expect(settings.aiMemoryEnabled).toBe(false);
  });
});
