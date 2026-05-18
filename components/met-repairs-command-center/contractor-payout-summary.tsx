import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { ContractorPayoutRow } from '@/lib/integrations/met-repairs/types';

interface ContractorPayoutSummaryProps {
  rows: ContractorPayoutRow[];
}

export function ContractorPayoutSummary({ rows }: ContractorPayoutSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contractor payout summary</CardTitle>
        <CardDescription>Payout volume and profit contribution per contractor.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contractor payout data available.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Contractor</th>
                <th className="pb-2 pr-4 font-medium">Jobs completed</th>
                <th className="pb-2 pr-4 font-medium">Total payout</th>
                <th className="pb-2 pr-4 font-medium">Avg payout</th>
                <th className="pb-2 pr-4 font-medium">Avg profit / job</th>
                <th className="pb-2 font-medium">Reliability</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.contractorId} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{row.contractorName}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{row.jobsCompleted}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(row.totalPayout)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(row.averagePayout)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">
                    {formatCurrency(row.averageProfitPerJob)}
                  </td>
                  <td className="py-2.5 tabular-nums">
                    {row.reliabilityScore != null ? row.reliabilityScore.toFixed(1) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
