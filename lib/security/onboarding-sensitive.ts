import { decryptJson, encryptJson, isEncryptedPayload } from '@/lib/security/encryption';

export type OnboardingSensitivePayload = {
  incomeSources?: unknown;
  shortTermGoals?: unknown;
  longTermGoals?: unknown;
  preferredInvestments?: unknown;
  areasOfInterest?: unknown;
  notificationPreferences?: unknown;
};

export function isOnboardingEncryptionEnabled(): boolean {
  return process.env.ENCRYPT_ONBOARDING_SENSITIVE === 'true';
}

export function packOnboardingSensitive(data: OnboardingSensitivePayload): {
  sensitiveProfileEncrypted: string | null;
  clearFields: OnboardingSensitivePayload;
} {
  if (!isOnboardingEncryptionEnabled()) {
    return { sensitiveProfileEncrypted: null, clearFields: data };
  }

  const hasSensitive = Object.values(data).some(v => v !== undefined && v !== null);
  if (!hasSensitive) {
    return { sensitiveProfileEncrypted: null, clearFields: {} };
  }

  return {
    sensitiveProfileEncrypted: encryptJson(data),
    clearFields: {
      incomeSources: data.incomeSources !== undefined ? { _encrypted: true } : undefined,
      shortTermGoals: data.shortTermGoals !== undefined ? { _encrypted: true } : undefined,
      longTermGoals: data.longTermGoals !== undefined ? { _encrypted: true } : undefined,
      preferredInvestments:
        data.preferredInvestments !== undefined ? { _encrypted: true } : undefined,
      areasOfInterest: data.areasOfInterest !== undefined ? { _encrypted: true } : undefined,
      notificationPreferences:
        data.notificationPreferences !== undefined ? { _encrypted: true } : undefined,
    },
  };
}

export function unpackOnboardingSensitive(row: {
  sensitiveProfileEncrypted?: string | null;
  incomeSources?: unknown;
  shortTermGoals?: unknown;
  longTermGoals?: unknown;
  preferredInvestments?: unknown;
  areasOfInterest?: unknown;
  notificationPreferences?: unknown;
}): OnboardingSensitivePayload {
  if (!row.sensitiveProfileEncrypted) {
    return {
      incomeSources: row.incomeSources,
      shortTermGoals: row.shortTermGoals,
      longTermGoals: row.longTermGoals,
      preferredInvestments: row.preferredInvestments,
      areasOfInterest: row.areasOfInterest,
      notificationPreferences: row.notificationPreferences,
    };
  }

  if (!isEncryptedPayload(row.sensitiveProfileEncrypted)) {
    return {};
  }

  try {
    return decryptJson<OnboardingSensitivePayload>(row.sensitiveProfileEncrypted);
  } catch {
    return {};
  }
}
