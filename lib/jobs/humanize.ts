/** Display labels for Prisma enum-style strings in the Jobs UI. */

export function humanizeEnum(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  return value
    .split('_')
    .map(w => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}
