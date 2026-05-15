/**
 * Memo & merchant recognition.
 *
 * Bank descriptions, Plaid `merchant_name` strings, and manual ledger memos all
 * tend to be noisy: terminal IDs, reference codes, ALL CAPS dates, channel
 * prefixes (`VENMO PMT`, `CASHAPP*`, `ACH CREDIT`), and other framing that splits
 * what is really *one* recurring payer into many one-off rows.
 *
 * This module produces a stable, channel-aware fingerprint plus a human-friendly
 * display name so downstream features — recurrence detection, income
 * concentration, transfer filtering, dedupe candidates, and operational
 * classification — all share one source of truth.
 *
 * Everything here is pure (no DB, no Date.now). Pattern lists are explicit so
 * additions are reviewable in source rather than buried behind a schema flag.
 */

export type PaymentChannel =
  | 'venmo'
  | 'cashapp'
  | 'zelle'
  | 'apple_cash'
  | 'google_pay'
  | 'paypal'
  | 'stripe'
  | 'square'
  | 'wire'
  | 'ach'
  | 'check'
  | 'atm'
  | 'pos'
  | 'unknown';

export interface RecognizedMemo {
  /** Stable grouping key: channel + counterparty for P2P, top tokens for everything else. */
  groupKey: string;
  /** Alias for `groupKey` kept for callers thinking in "fingerprint" terms. */
  fingerprint: string;
  /** Human-friendly Title Case label (e.g. "Acme Coffee", "Jane Doe (Venmo)"). */
  displayName: string;
  /** Best-guess payment channel inferred from the raw text. */
  channel: PaymentChannel;
  /** Lowercased counterparty if extractable (typically only set for P2P channels). */
  counterparty: string | null;
  /** Whitespace-collapsed, noise-stripped, lowercased text. Useful for debugging. */
  cleaned: string;
  /** Original input lowercased. Preserved verbatim for trust/audit. */
  raw: string;
  /** True when the memo looks like a self-account transfer (Venmo→bank, ATM, wire, etc.). */
  isLikelyTransfer: boolean;
  /** 0–1 confidence in the merchant / counterparty inference. */
  confidence: number;
  /** Deterministic explanations — surfaced in trust panels and tests. */
  reasoning: string[];
}

/** Channel match order matters: more specific names come first. */
const CHANNEL_PATTERNS: ReadonlyArray<{ ch: PaymentChannel; rx: RegExp }> = [
  { ch: 'venmo', rx: /\bvenmo\b/i },
  { ch: 'cashapp', rx: /\bcash[\s.-]*app\b/i },
  { ch: 'zelle', rx: /\bzelle\b/i },
  { ch: 'apple_cash', rx: /\bapple\s*cash\b/i },
  { ch: 'google_pay', rx: /\b(?:google|g)\s*pay\b/i },
  { ch: 'paypal', rx: /\bpaypal\b/i },
  { ch: 'stripe', rx: /\bstripe\b/i },
  { ch: 'square', rx: /\b(?:square\s*inc|sq\s*\*)/i },
  { ch: 'wire', rx: /\bwire\s*(?:transfer|tfr)?\b/i },
  { ch: 'ach', rx: /\b(?:ach|eft|direct\s*dep(?:osit)?|dda)\b/i },
  { ch: 'check', rx: /\bcheck\s*#?\d+\b/i },
  { ch: 'atm', rx: /\batm\b/i },
  { ch: 'pos', rx: /\b(?:pos|purchase\s*debit|checkcard)\b/i },
];

/** Channels that are self-account transfers by default. */
const TRANSFER_DEFAULT_CHANNELS = new Set<PaymentChannel>(['atm', 'wire']);

/** P2P channels where it makes sense to extract a counterparty name. */
const P2P_CHANNELS = new Set<PaymentChannel>([
  'venmo',
  'cashapp',
  'zelle',
  'apple_cash',
  'google_pay',
  'paypal',
]);

/** Phrasing that turns a P2P channel into a clear self-transfer. */
const TRANSFER_HINT_RX =
  /\b(?:transfer|cashout|cash\s*out|tfr|internal\s*transfer|book\s*transfer|between\s*accounts|to\s*(?:bank|checking|savings))\b/i;

/** Words that connect a channel marker to a counterparty name. */
const COUNTERPARTY_CONNECTOR_RX =
  /\b(?:from|to|with|for|payment\s*from|payment\s*to|transfer\s*from|transfer\s*to|sent\s*to|received\s*from)\s+/i;

/** Generic banking / commerce noise tokens that should not anchor a merchant fingerprint. */
const STOP_TOKENS: ReadonlySet<string> = new Set([
  // company suffixes
  'inc', 'incorporated', 'llc', 'ltd', 'co', 'corp', 'corporation', 'company',
  'plc', 'svcs', 'services', 'svc', 'holdings', 'group',
  // grammar
  'the', 'of', 'and', 'at', 'in', 'on', 'for', 'to', 'from', 'with', 'by', 'via',
  // geography (short, ambiguous)
  'usa', 'us', 'la', 'ny', 'ca', 'tx', 'fl', 'wa', 'nj',
  // payment framing
  'pmt', 'payment', 'pay', 'paid', 'xfer', 'transfer', 'tfr', 'ach', 'pos',
  'debit', 'credit', 'purchase', 'card', 'recurring', 'recur', 'authorized',
  'authd', 'auth', 'dep', 'deposit', 'direct', 'eft', 'dda', 'sgl', 'ppd', 'tel',
  // delivery / channel framing
  'online', 'mobile', 'app', 'web', 'www', 'com', 'net', 'org',
  'merchant', 'visa', 'mastercard', 'amex', 'discover',
  'electronic', 'wire', 'check', 'checkcard', 'atm',
]);

const NOISE_PATTERNS: ReadonlyArray<RegExp> = [
  /#\s*\d+/g,                                  // #1234 references
  /\bref\s*[:#]?\s*[\w-]+\b/gi,               // REF: ABC123
  /\bauth\s*[:#]?\s*[\w-]+\b/gi,              // AUTH 0042
  /\bid\s*[:#]?\s*[\w-]+\b/gi,                // ID#ABC
  /\b(?:trace|conf|confirmation)\s*[:#]?\s*[\w-]+\b/gi,
  /\bx{2,}\d+\b/gi,                           // xxxx1234 / xx9988
  /\bcheck\s*#?\d+\b/gi,                      // check #1024
  /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,      // 5/8, 05/08/26
  /\b\d{4}-\d{2}-\d{2}\b/g,                   // 2026-05-08
  /\b\d{1,2}:\d{2}(?:\s*[ap]m)?\b/gi,         // times
  /\b\d{3,}\b/g,                              // bare reference numbers (12345, 0042, terminal IDs)
  /\bdebit\s*card\s*purchase\b/gi,
  /\bonline\s*payment\b/gi,
  /\brecurring\s*payment\b/gi,
  /\bach\s*credit\b/gi,
  /\bach\s*debit\b/gi,
  /[*]{2,}/g,
  /[|]+/g,
  /[•·]/g,
];

/** Patterns used to strip the channel marker itself before tokenizing. */
const CHANNEL_STRIP_PATTERNS: Record<PaymentChannel, RegExp[]> = {
  venmo: [/\bvenmo\s*(?:payment|cashout|cash\s*out|transfer|pmt|inst|inc)?\b/gi],
  cashapp: [/\bcash[\s.-]*app\s*\*?/gi],
  zelle: [/\bzelle\s*(?:payment|transfer|from|to)?\b/gi],
  apple_cash: [/\bapple\s*cash\b/gi],
  google_pay: [/\b(?:google|g)\s*pay\b/gi],
  paypal: [/\bpaypal\s*\*?\s*(?:transfer|inst\s*xfer|payment|des)?\b/gi],
  stripe: [/\bstripe\s*(?:payout|transfer)?\b/gi, /\bst[-_]\w+\b/gi],
  square: [/\bsq\s*\*\s*/gi, /\bsquare\s*inc\b/gi],
  wire: [/\bwire\s*(?:transfer|tfr)?\b/gi],
  ach: [/\bach\b/gi, /\beft\b/gi, /\bdirect\s*dep(?:osit)?\b/gi, /\bdda\b/gi],
  check: [/\bcheck\s*#?\d+\b/gi],
  atm: [/\batm\b/gi, /\bwithdrawal\b/gi],
  pos: [/\bpos\b/gi, /\bpurchase\s*debit\b/gi, /\bcheckcard\b/gi],
  unknown: [],
};

function detectChannel(text: string): PaymentChannel {
  for (const pattern of CHANNEL_PATTERNS) {
    if (pattern.rx.test(text)) return pattern.ch;
  }
  return 'unknown';
}

function stripChannelMarkers(text: string, channel: PaymentChannel): string {
  let out = text;
  for (const rx of CHANNEL_STRIP_PATTERNS[channel]) {
    out = out.replace(rx, ' ');
  }
  return out;
}

function stripNoise(text: string): string {
  let out = text;
  for (const rx of NOISE_PATTERNS) {
    out = out.replace(rx, ' ');
  }
  return out;
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return text
    .split(/[^a-z0-9]+/i)
    .map(t => t.toLowerCase())
    .filter(t => t.length >= 2)
    .filter(t => !STOP_TOKENS.has(t))
    .filter(t => !/^\d+$/.test(t));
}

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function prettyChannel(channel: PaymentChannel): string {
  switch (channel) {
    case 'venmo': return 'Venmo';
    case 'cashapp': return 'Cash App';
    case 'zelle': return 'Zelle';
    case 'apple_cash': return 'Apple Cash';
    case 'google_pay': return 'Google Pay';
    case 'paypal': return 'PayPal';
    case 'stripe': return 'Stripe';
    case 'square': return 'Square';
    case 'wire': return 'Wire';
    case 'ach': return 'ACH';
    case 'check': return 'Check';
    case 'atm': return 'ATM';
    case 'pos': return 'POS';
    default: return '';
  }
}

interface ExtractionResult {
  counterparty: string | null;
  cleaned: string;
}

function extractCounterparty(rawLower: string, channel: PaymentChannel): ExtractionResult {
  let working = stripChannelMarkers(rawLower, channel);
  working = stripNoise(working);
  working = collapseWhitespace(working);

  if (!P2P_CHANNELS.has(channel)) {
    return { counterparty: null, cleaned: working };
  }

  // Self-account transfer phrasing means there's no real human counterparty to pick.
  if (TRANSFER_HINT_RX.test(working)) {
    return { counterparty: null, cleaned: working };
  }

  const refineCandidate = (candidate: string): string | null => {
    const refined = tokenize(candidate).slice(0, 5).join(' ');
    return refined || null;
  };

  const connectorMatch = working.match(COUNTERPARTY_CONNECTOR_RX);
  if (connectorMatch && typeof connectorMatch.index === 'number') {
    const after = working.slice(connectorMatch.index + connectorMatch[0].length);
    return { counterparty: refineCandidate(after), cleaned: working };
  }

  // No connector word — what's left after stripping the channel marker is usually the name.
  return { counterparty: refineCandidate(working), cleaned: working };
}

function buildGroupKey(
  channel: PaymentChannel,
  counterparty: string | null,
  cleaned: string,
  rawLower: string,
): string {
  if (P2P_CHANNELS.has(channel)) {
    if (counterparty) {
      const tokens = tokenize(counterparty).slice(0, 3);
      if (tokens.length > 0) return `${channel}:${tokens.join(' ')}`;
    }
    return `${channel}:unknown`;
  }

  const tokens = tokenize(cleaned || rawLower);
  if (tokens.length === 0) {
    const fallback = collapseWhitespace(rawLower).slice(0, 32);
    return fallback || 'unknown';
  }

  // Unknown channel: anchor on the single most distinctive token so embedded
  // city/state words ("STARBUCKS SAN FRANCISCO") don't fork the group. Known
  // channels keep up to two tokens because the channel prefix already prevents
  // collision with unrelated merchants.
  const tokenCount = channel === 'unknown' ? 1 : 2;
  const top = tokens.slice(0, tokenCount).join(' ');
  return channel === 'unknown' ? top : `${channel}:${top}`;
}

function computeConfidence(args: {
  channel: PaymentChannel;
  counterparty: string | null;
  tokens: string[];
  rawLower: string;
}): number {
  let score = 0.4;
  if (args.channel !== 'unknown') score += 0.2;
  if (P2P_CHANNELS.has(args.channel) && args.counterparty) score += 0.2;
  if (args.tokens.length > 0) score += 0.1;
  if (args.tokens.length >= 2) score += 0.05;
  if (args.rawLower.length >= 8) score += 0.05;
  return Math.max(0, Math.min(1, score));
}

function buildReasoning(args: {
  channel: PaymentChannel;
  counterparty: string | null;
  isTransfer: boolean;
  groupKey: string;
  tokens: string[];
}): string[] {
  const out: string[] = [];
  out.push(
    args.channel === 'unknown'
      ? 'No payment channel marker detected — falling back to descriptive tokens.'
      : `Channel ${prettyChannel(args.channel)} detected from the memo.`,
  );
  if (P2P_CHANNELS.has(args.channel)) {
    out.push(
      args.counterparty
        ? `Extracted counterparty "${args.counterparty}" used as the grouping anchor.`
        : 'No clear counterparty extracted; grouping anchored on the channel.',
    );
  } else if (args.tokens.length > 0) {
    out.push(`Top significant tokens: ${args.tokens.slice(0, 3).join(', ')}.`);
  }
  if (args.isTransfer) {
    out.push('Self-account transfer indicators present — excluded from income/expense roll-ups.');
  }
  out.push(`Final group key: ${args.groupKey}.`);
  return out;
}

/** Recognize a raw bank description / Plaid merchant string. Pure function. */
export function recognizeMemo(input: {
  description?: string | null;
  merchantName?: string | null;
}): RecognizedMemo {
  const merchant = input.merchantName?.trim() ?? '';
  const description = input.description?.trim() ?? '';
  const raw = (merchant.length >= 2 ? merchant : description).slice(0, 256);
  const rawLower = raw.toLowerCase();

  const channel = detectChannel(rawLower);
  const { counterparty, cleaned } = extractCounterparty(rawLower, channel);

  const explicitTransfer = TRANSFER_HINT_RX.test(rawLower);
  const isLikelyTransfer = explicitTransfer || TRANSFER_DEFAULT_CHANNELS.has(channel);

  const groupKey = buildGroupKey(channel, counterparty, cleaned, rawLower);
  const tokens = tokenize(cleaned || rawLower);

  let displayName: string;
  if (P2P_CHANNELS.has(channel) && counterparty) {
    const channelLabel = prettyChannel(channel);
    displayName = channelLabel
      ? `${titleCase(counterparty)} (${channelLabel})`
      : titleCase(counterparty);
  } else if (tokens.length > 0) {
    displayName = titleCase(tokens.slice(0, 3).join(' '));
  } else if (merchant) {
    displayName = merchant.slice(0, 80);
  } else {
    displayName = titleCase(raw).slice(0, 80) || 'Unknown';
  }

  const confidence = computeConfidence({ channel, counterparty, tokens, rawLower });
  const reasoning = buildReasoning({
    channel,
    counterparty,
    isTransfer: isLikelyTransfer,
    groupKey,
    tokens,
  });

  return {
    groupKey,
    fingerprint: groupKey,
    displayName,
    channel,
    counterparty,
    cleaned,
    raw: rawLower,
    isLikelyTransfer,
    confidence,
    reasoning,
  };
}

/** Compact wrapper for callers that only need the grouping key. */
export function buildMerchantGroupKey(input: {
  description?: string | null;
  merchantName?: string | null;
}): string {
  return recognizeMemo(input).groupKey;
}

/** Compact wrapper for the human-readable label. */
export function formatMerchantDisplay(input: {
  description?: string | null;
  merchantName?: string | null;
}): string {
  return recognizeMemo(input).displayName;
}

/** Channel-aware transfer detection. Accepts a plain string for legacy callers. */
export function isLikelyTransfer(
  input: string | { description?: string | null; merchantName?: string | null },
): boolean {
  if (typeof input === 'string') {
    return recognizeMemo({ description: input }).isLikelyTransfer;
  }
  return recognizeMemo(input).isLikelyTransfer;
}
