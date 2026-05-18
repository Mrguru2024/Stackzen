export class ProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`AI provider not configured: ${provider}`);
    this.name = 'ProviderNotConfiguredError';
  }
}

export class ProviderRateLimitError extends Error {
  constructor(provider: string, status: number) {
    super(`AI provider rate limited (${provider}): ${status}`);
    this.name = 'ProviderRateLimitError';
  }
}

export class ProviderTimeoutError extends Error {
  constructor(provider: string) {
    super(`AI provider request timed out: ${provider}`);
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderResponseError extends Error {
  constructor(provider: string, status: number, detail?: string) {
    super(`AI provider error (${provider}): ${status}${detail ? ` — ${detail}` : ''}`);
    this.name = 'ProviderResponseError';
  }
}
