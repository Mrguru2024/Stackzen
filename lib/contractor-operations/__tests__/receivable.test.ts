import { computeReceivableConcentration } from '@/lib/contractor-operations/receivable';

describe('computeReceivableConcentration', () => {
  it('returns HHI 1 for single-client open AR', () => {
    const r = computeReceivableConcentration([
      { invoiceId: 'a', clientId: 'c1', amount: 100 },
      { invoiceId: 'b', clientId: 'c1', amount: 200 },
    ]);
    expect(r.totalOpenUsd).toBe(300);
    expect(r.herfindahlIndex).toBeCloseTo(1, 5);
  });

  it('splits shares across clients', () => {
    const r = computeReceivableConcentration([
      { invoiceId: 'a', clientId: 'c1', amount: 100 },
      { invoiceId: 'b', clientId: 'c2', amount: 100 },
    ]);
    expect(r.herfindahlIndex).toBeCloseTo(0.5, 5);
  });
});
