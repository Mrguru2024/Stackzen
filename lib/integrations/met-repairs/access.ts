import 'server-only';

/**
 * MET Repairs OS role mapping → StackZen `UserRole`:
 * - OWNER          → SUPER_ADMIN
 * - ADMIN          → ADMIN
 * - BUSINESS_ADMIN → ADMIN
 */
export const MET_REPAIRS_COMMAND_CENTER_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;

export type MetRepairsCommandCenterRole = (typeof MET_REPAIRS_COMMAND_CENTER_ROLES)[number];

export function normalizeStackZenRole(role: string | undefined): string {
  return (role ?? '').toUpperCase();
}

export function canAccessMetRepairsCommandCenter(role: string | undefined): boolean {
  const normalized = normalizeStackZenRole(role);
  return MET_REPAIRS_COMMAND_CENTER_ROLES.includes(
    normalized as MetRepairsCommandCenterRole
  );
}
