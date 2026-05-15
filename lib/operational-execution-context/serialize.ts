import type {
  CommandCenterCtaLadderStep,
  OperationalExecutionSource,
  OperationalHandoffBand,
  OperationalHandoffSubsystem,
} from '@/lib/operational-execution-context/types';

export interface SerializeOperationalHandoffInput {
  source: OperationalExecutionSource;
  subsystem?: OperationalHandoffSubsystem;
  band?: OperationalHandoffBand;
  ctaLadderStep?: CommandCenterCtaLadderStep;
}

const MAX_QUERY_LEN = 512;

/** Returns `key=value&...` without leading `?`. */
export function serializeOperationalHandoffQuery(input: SerializeOperationalHandoffInput): string {
  const usp = new URLSearchParams();
  usp.set('op_src', input.source);
  if (input.subsystem) usp.set('op_sub', input.subsystem);
  if (input.band) usp.set('op_band', input.band);
  if (input.ctaLadderStep != null) usp.set('op_step', String(input.ctaLadderStep));
  const s = usp.toString();
  return s.length > MAX_QUERY_LEN ? s.slice(0, MAX_QUERY_LEN) : s;
}

/**
 * Merges handoff query into href, preserving existing query params and `#hash`.
 * Handoff keys overwrite same-named keys on collision.
 */
export function appendOperationalHandoffToHref(
  href: string,
  input: SerializeOperationalHandoffInput
): string {
  const addition = serializeOperationalHandoffQuery(input);
  if (!addition) return href;

  const hashIdx = href.indexOf('#');
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
  const pathAndQuery = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const qIdx = pathAndQuery.indexOf('?');
  const path = qIdx >= 0 ? pathAndQuery.slice(0, qIdx) : pathAndQuery;
  const existing = qIdx >= 0 ? pathAndQuery.slice(qIdx + 1) : '';

  const merged = new URLSearchParams(existing);
  for (const [k, v] of new URLSearchParams(addition)) {
    merged.set(k, v);
  }
  const qs = merged.toString();
  return qs ? `${path}?${qs}${hash}` : `${path}${hash}`;
}
