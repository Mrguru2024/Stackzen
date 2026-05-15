export type OpenReceivableLite = { invoiceId: string; clientId: string; amount: number };

export function computeReceivableConcentration(rows: OpenReceivableLite[]): {
  totalOpenUsd: number;
  herfindahlIndex: number;
  topClients: { clientId: string; totalUsd: number; share: number; invoiceIds: string[] }[];
} {
  const sums = new Map<string, { total: number; ids: string[] }>();
  for (const r of rows) {
    const cur = sums.get(r.clientId);
    const amt = Math.max(0, r.amount);
    if (!cur) sums.set(r.clientId, { total: amt, ids: [r.invoiceId] });
    else {
      cur.total += amt;
      if (cur.ids.length < 8) cur.ids.push(r.invoiceId);
    }
  }
  let totalOpenUsd = 0;
  for (const v of sums.values()) totalOpenUsd += v.total;

  let herfindahlIndex = 0;
  if (totalOpenUsd > 0) {
    for (const v of sums.values()) {
      const s = v.total / totalOpenUsd;
      herfindahlIndex += s * s;
    }
  }

  const topClients = [...sums.entries()]
    .map(([clientId, v]) => ({
      clientId,
      totalUsd: v.total,
      share: totalOpenUsd > 0 ? v.total / totalOpenUsd : 0,
      invoiceIds: v.ids,
    }))
    .sort((a, b) => b.totalUsd - a.totalUsd)
    .slice(0, 6);

  return { totalOpenUsd, herfindahlIndex, topClients };
}
