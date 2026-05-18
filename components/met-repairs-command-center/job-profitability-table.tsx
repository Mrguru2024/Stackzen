import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import type { JobProfitabilityRow } from '@/lib/integrations/met-repairs/types';

interface JobProfitabilityTableProps {
  rows: JobProfitabilityRow[];
}

function riskVariant(risk: JobProfitabilityRow['risk']) {
  if (risk === 'high') return 'destructive' as const;
  if (risk === 'medium') return 'secondary' as const;
  return 'outline' as const;
}

export function JobProfitabilityTable({ rows }: JobProfitabilityTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Job profitability</CardTitle>
        <CardDescription>Work order margin and risk from MET Repairs OS.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs to analyze yet.</p>
        ) : (
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Job / work order</th>
                <th className="pb-2 pr-4 font-medium">Client</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Revenue</th>
                <th className="pb-2 pr-4 font-medium">Expenses</th>
                <th className="pb-2 pr-4 font-medium">Net profit</th>
                <th className="pb-2 pr-4 font-medium">Margin</th>
                <th className="pb-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.jobId} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{row.workOrderLabel}</td>
                  <td className="py-2.5 pr-4">{row.clientName}</td>
                  <td className="py-2.5 pr-4">{row.status}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(row.revenue)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(row.expenses)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(row.netProfit)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatPercentage(row.margin)}</td>
                  <td className="py-2.5">
                    <Badge variant={riskVariant(row.risk)}>{row.risk}</Badge>
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
