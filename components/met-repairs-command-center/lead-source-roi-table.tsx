import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import type { LeadSourceRoiRow } from '@/lib/integrations/met-repairs/types';

interface LeadSourceRoiTableProps {
  rows: LeadSourceRoiRow[];
}

export function LeadSourceRoiTable({ rows }: LeadSourceRoiTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lead source ROI</CardTitle>
        <CardDescription>Revenue and acquisition cost by channel.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No lead source data available.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Lead source</th>
                <th className="pb-2 pr-4 font-medium">Revenue</th>
                <th className="pb-2 pr-4 font-medium">Lead cost</th>
                <th className="pb-2 pr-4 font-medium">Closed jobs</th>
                <th className="pb-2 pr-4 font-medium">Net profit</th>
                <th className="pb-2 pr-4 font-medium">ROI</th>
                <th className="pb-2 font-medium">Cost / closed job</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.leadSource} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{row.leadSource}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(row.revenue)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(row.leadCost)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{row.closedJobs}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(row.netProfit)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatPercentage(row.roi)}</td>
                  <td className="py-2.5 tabular-nums">{formatCurrency(row.costPerClosedJob)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
