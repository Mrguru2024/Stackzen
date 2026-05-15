import { buildAddToGoogleCalendarUrl, buildIcsFeed } from '@/lib/timing-coordination/ics-feed';
import type { TimingCalendarEntryDto } from '@/lib/timing-coordination/types';

function entry(partial: Partial<TimingCalendarEntryDto> = {}): TimingCalendarEntryDto {
  return {
    id: partial.id ?? 'abc',
    date: partial.date ?? '2026-06-10',
    kind: partial.kind ?? 'recurring_bill',
    direction: partial.direction ?? 'OUTFLOW',
    label: partial.label ?? 'Rent payment',
    amountUsd: partial.amountUsd ?? 1200,
    referenceIds: partial.referenceIds ?? ['bill-1'],
    clusterId: partial.clusterId ?? null,
    shiftable: partial.shiftable ?? true,
    reasoning: partial.reasoning ?? ['Recurring bill row.'],
  };
}

describe('buildIcsFeed', () => {
  const opts = { feedName: 'StackZen Test', feedUrl: 'https://stackzen.example/feed.ics' };

  it('produces a RFC 5545 wrapper with calendar metadata', () => {
    const ics = buildIcsFeed([entry()], opts);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.includes('PRODID:-//StackZen//Timing Coordination//EN')).toBe(true);
    expect(ics.includes('X-WR-CALNAME:StackZen Test')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('emits an all-day VEVENT per entry with stable UID and direction prefix', () => {
    const ics = buildIcsFeed([entry()], opts);
    expect(ics.includes('UID:abc@stackzen')).toBe(true);
    expect(ics.includes('DTSTART;VALUE=DATE:20260610')).toBe(true);
    expect(ics.includes('DTEND;VALUE=DATE:20260611')).toBe(true);
    expect(ics.includes('SUMMARY:[-] Rent payment')).toBe(true);
    expect(ics.includes('CATEGORIES:recurring_bill\\,StackZen Timing')).toBe(true);
    expect(ics.includes('STATUS:CONFIRMED')).toBe(true);
    expect(ics.includes('TRANSP:TRANSPARENT')).toBe(true);
  });

  it('escapes commas / semicolons / newlines in label and description', () => {
    const ics = buildIcsFeed(
      [entry({ label: 'Bill, with; comma\nand newline', reasoning: ['First; reason', 'Second, reason'] })],
      opts
    );
    expect(ics.includes('\\,')).toBe(true);
    expect(ics.includes('\\;')).toBe(true);
    expect(ics.includes('\\n')).toBe(true);
  });

  it('produces an INFLOW prefix and NEUTRAL prefix correctly', () => {
    const ics = buildIcsFeed(
      [
        entry({ id: 'i', direction: 'INFLOW', label: 'Paycheck' }),
        entry({ id: 'n', direction: 'NEUTRAL', label: 'Goal target', amountUsd: null }),
      ],
      opts
    );
    expect(ics.includes('SUMMARY:[+] Paycheck')).toBe(true);
    expect(ics.includes('SUMMARY:[ ] Goal target')).toBe(true);
  });
});

describe('buildAddToGoogleCalendarUrl', () => {
  it('produces a Google Calendar render URL with deterministic date format', () => {
    const url = buildAddToGoogleCalendarUrl(entry({ date: '2026-06-10' }));
    expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(true);
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('dates=20260610%2F20260611');
    expect(url).toContain('text=');
  });
});
