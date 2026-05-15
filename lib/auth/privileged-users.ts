const PRIVILEGED_EMAILS = new Set(['5epmgllc@gmail.com']);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isPrivilegedEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return PRIVILEGED_EMAILS.has(normalizeEmail(email));
}

