import type { TimingCalendarEntryDto } from '@/lib/timing-coordination/types';

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function ymdCompact(ymd: string): string {
  // 2026-05-11 → 20260511
  return ymd.slice(0, 10).replace(/-/g, '');
}

function plusOneDay(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return ymd.replace(ymd.slice(0, 10), d.toISOString().slice(0, 10));
}

function summaryPrefix(direction: TimingCalendarEntryDto['direction']): string {
  if (direction === 'INFLOW') return '[+]';
  if (direction === 'OUTFLOW') return '[-]';
  return '[ ]';
}

export interface BuildIcsFeedOptions {
  feedName: string;
  feedUrl: string;
  /** When provided, included as `LAST-MODIFIED`/`DTSTAMP` for caches. */
  generatedAt?: string;
}

/**
 * Build an RFC 5545 compliant ICS feed for the timing-coordination calendar.
 * Pure: takes already-built entries, no IO.
 */
export function buildIcsFeed(
  entries: TimingCalendarEntryDto[],
  opts: BuildIcsFeedOptions
): string {
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//StackZen//Timing Coordination//EN');
  lines.push(`X-WR-CALNAME:${escapeIcsText(opts.feedName)}`);
  lines.push(`X-WR-CALDESC:${escapeIcsText('Deterministic financial obligations from StackZen — read-only.')}`);
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-PUBLISHED-TTL:PT1H');
  lines.push(`X-ORIGINAL-URL:${escapeIcsText(opts.feedUrl)}`);

  const dtstamp = (opts.generatedAt ?? new Date().toISOString())
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z?$/, 'Z');

  for (const entry of entries) {
    const ymd = entry.date.slice(0, 10);
    const startCompact = ymdCompact(ymd);
    const endCompact = ymdCompact(plusOneDay(ymd));
    const summary = `${summaryPrefix(entry.direction)} ${entry.label}`;
    const description = [
      entry.amountUsd != null ? `Amount: $${entry.amountUsd.toFixed(2)}` : null,
      `Direction: ${entry.direction}`,
      `Kind: ${entry.kind}`,
      entry.clusterId ? `Cluster: ${entry.clusterId}` : null,
      entry.referenceIds.length > 0 ? `Refs: ${entry.referenceIds.join(', ')}` : null,
      entry.reasoning.length > 0 ? `Reason: ${entry.reasoning.join(' | ')}` : null,
    ]
      .filter(Boolean)
      .join(' \\n ');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${entry.id}@stackzen`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${startCompact}`);
    lines.push(`DTEND;VALUE=DATE:${endCompact}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    lines.push(`CATEGORIES:${escapeIcsText(`${entry.kind},StackZen Timing`)}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  // RFC 5545 requires CRLF line endings.
  return lines.join('\r\n') + '\r\n';
}

/**
 * Builds a deep-link to Google Calendar's pre-filled event-creation page.
 * No OAuth, no tokens — Google opens its own UI and the user clicks Save.
 */
export function buildAddToGoogleCalendarUrl(
  entry: TimingCalendarEntryDto,
  opts?: { detailsSuffix?: string }
): string {
  const ymd = entry.date.slice(0, 10);
  const start = ymdCompact(ymd);
  const end = ymdCompact(plusOneDay(ymd));
  const summary = `${summaryPrefix(entry.direction)} ${entry.label}`;
  const detailsParts = [
    entry.amountUsd != null ? `Amount: $${entry.amountUsd.toFixed(2)}` : null,
    `Direction: ${entry.direction}`,
    entry.reasoning.length > 0 ? entry.reasoning.join(' | ') : null,
    opts?.detailsSuffix ?? null,
  ].filter(Boolean) as string[];

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: summary,
    dates: `${start}/${end}`,
    details: detailsParts.join('\n'),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
