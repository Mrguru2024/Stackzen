import {
  buildMerchantGroupKey,
  formatMerchantDisplay,
  isLikelyTransfer,
  recognizeMemo,
} from '../memo-recognition';

describe('recognizeMemo — channel detection', () => {
  it.each([
    ['VENMO PMT 12345 JOHN DOE', 'venmo'],
    ['Cash App * Jane D', 'cashapp'],
    ['ZELLE FROM RICHARD ROE', 'zelle'],
    ['APPLE CASH FROM SAM Q', 'apple_cash'],
    ['Google Pay 4112 BURRITO BAR', 'google_pay'],
    ['PAYPAL *UPWORK INC', 'paypal'],
    ['STRIPE PAYOUT ST-ABC123', 'stripe'],
    ['SQ *POUR HOUSE', 'square'],
    ['WIRE TRANSFER FROM REMITLY', 'wire'],
    ['ACH CREDIT EMPLOYER PAYROLL 0042', 'ach'],
    ['CHECK #1024', 'check'],
    ['ATM WITHDRAWAL 7-11', 'atm'],
    ['CHECKCARD PURCHASE STARBUCKS 5/8', 'pos'],
    ['Starbucks Coffee #6042', 'unknown'],
  ])('detects %s as channel %s', (input, expected) => {
    expect(recognizeMemo({ description: input }).channel).toBe(expected);
  });
});

describe('recognizeMemo — counterparty extraction', () => {
  it('extracts a person from a Venmo memo', () => {
    const r = recognizeMemo({ description: 'VENMO PMT 12345 JOHN DOE' });
    expect(r.counterparty).toBe('john doe');
    expect(r.displayName).toBe('John Doe (Venmo)');
  });

  it('extracts a person from a Zelle memo with a connector word', () => {
    const r = recognizeMemo({ description: 'Zelle payment from Richard Roe' });
    expect(r.counterparty).toBe('richard roe');
    expect(r.displayName).toBe('Richard Roe (Zelle)');
  });

  it('returns no counterparty for self-account Venmo cashout', () => {
    const r = recognizeMemo({ description: 'VENMO CASHOUT to bank' });
    expect(r.counterparty).toBeNull();
    expect(r.isLikelyTransfer).toBe(true);
  });
});

describe('recognizeMemo — group key stability', () => {
  it('collapses Venmo payments from the same person regardless of reference', () => {
    const k1 = buildMerchantGroupKey({ description: 'VENMO PMT 12345 JOHN DOE' });
    const k2 = buildMerchantGroupKey({ description: 'venmo payment 67890 john doe' });
    const k3 = buildMerchantGroupKey({ description: 'Venmo to John Doe 5/8' });
    expect(k1).toBe(k2);
    expect(k1).toBe(k3);
    expect(k1.startsWith('venmo:')).toBe(true);
  });

  it('collapses Starbucks receipts across stores and prefixes', () => {
    const k1 = buildMerchantGroupKey({ description: 'STARBUCKS #1234 SAN FRANCISCO' });
    const k2 = buildMerchantGroupKey({ description: 'CHECKCARD PURCHASE STARBUCKS 5/8' });
    const k3 = buildMerchantGroupKey({ merchantName: 'Starbucks Coffee #6042' });
    expect(k1).toBe(k3);
    // POS-prefixed memo is grouped under the POS channel — distinguishable from
    // a fully un-prefixed memo but still anchored on "starbucks".
    expect(k2.endsWith(':starbucks')).toBe(true);
    expect(k1.endsWith('starbucks')).toBe(true);
  });

  it('groups ACH payroll deposits across reference numbers', () => {
    const k1 = buildMerchantGroupKey({ description: 'ACH CREDIT EMPLOYER PAYROLL 0042' });
    const k2 = buildMerchantGroupKey({ description: 'ACH CREDIT EMPLOYER PAYROLL 1188' });
    expect(k1).toBe(k2);
  });
});

describe('recognizeMemo — transfer detection', () => {
  it.each([
    'VENMO CASHOUT to bank',
    'Zelle transfer to checking',
    'INTERNAL TRANSFER',
    'WIRE TRANSFER FROM SAVINGS',
    'ATM WITHDRAWAL 7-11',
  ])('marks "%s" as transfer', input => {
    expect(isLikelyTransfer(input)).toBe(true);
  });

  it.each([
    'VENMO PMT 12345 JOHN DOE',
    'Cash App * Jane D',
    'STRIPE PAYOUT ST-ABC123',
    'STARBUCKS #6042',
    'ACH CREDIT EMPLOYER PAYROLL',
  ])('does not mark "%s" as transfer', input => {
    expect(isLikelyTransfer(input)).toBe(false);
  });
});

describe('recognizeMemo — display formatting', () => {
  it('produces a Title Case label for plain merchant strings', () => {
    expect(formatMerchantDisplay({ description: 'STARBUCKS #1234' })).toBe('Starbucks');
  });

  it('annotates P2P payers with the channel name', () => {
    expect(formatMerchantDisplay({ description: 'VENMO PMT JANE SMITH' })).toBe(
      'Jane Smith (Venmo)',
    );
  });

  it('prefers merchantName when both fields are provided', () => {
    const r = recognizeMemo({
      merchantName: 'Acme Coffee',
      description: 'CHECKCARD PURCHASE ACME COFFEE #6042 5/8',
    });
    expect(r.displayName).toBe('Acme Coffee');
  });
});

describe('recognizeMemo — confidence + reasoning', () => {
  it('returns higher confidence when both channel and counterparty are present', () => {
    const strong = recognizeMemo({ description: 'VENMO PMT JOHN DOE' });
    const weak = recognizeMemo({ description: 'XYZ' });
    expect(strong.confidence).toBeGreaterThan(weak.confidence);
  });

  it('includes reasoning lines used by the trust panel', () => {
    const r = recognizeMemo({ description: 'VENMO PMT JOHN DOE' });
    expect(r.reasoning.some(l => l.toLowerCase().includes('venmo'))).toBe(true);
    expect(r.reasoning.some(l => l.toLowerCase().includes('counterparty'))).toBe(true);
  });
});
