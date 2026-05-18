/**
 * WebAuthn / passkey foundation (feature-flagged).
 * Full registration/authentication ceremonies ship after Phase 3 schema is deployed.
 */

export function isWebAuthnEnabled(): boolean {
  return process.env.ENABLE_WEBAUTHN === 'true';
}

export type PasskeyRegistrationOptions = {
  enabled: false;
  message: string;
};

export async function getPasskeyRegistrationOptions(
  _userId: string
): Promise<PasskeyRegistrationOptions> {
  if (!isWebAuthnEnabled()) {
    return {
      enabled: false,
      message: 'WebAuthn is not enabled for this environment.',
    };
  }

  return {
    enabled: false,
    message: 'Passkey registration API is not yet available. Use TOTP MFA for now.',
  };
}

export async function verifyPasskeyAuthentication(_params: {
  userId: string;
  response: unknown;
}): Promise<boolean> {
  if (!isWebAuthnEnabled()) {
    return false;
  }
  return false;
}
