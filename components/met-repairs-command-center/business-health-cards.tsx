import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import type { MetRepairFinancialSummary } from '@/lib/integrations/met-repairs/types';

interface BusinessHealthCardsProps {
  summary: MetRepairFinancialSummary;
}

const cards: Array<{
  key: keyof MetRepairFinancialSummary | 'revenue' | 'jobsLosingMoneyCount';
  label: string;
  format: 'currency' | 'percent' | 'count';
}> = [
  { key: 'revenue', label: 'Revenue', format: 'currency' },
  { key: 'netProfit', label: 'Net Profit', format: 'currency' },
  { key: 'averageMargin', label: 'Average Margin', format: 'percent' },
  { key: 'unpaidInvoiceTotal', label: 'Unpaid Invoices', format: 'currency' },
  { key: 'contractorPayoutTotal', label: 'Contractor Payouts', format: 'currency' },
  { key: 'jobsLosingMoneyCount', label: 'Jobs Losing Money', format: 'count' },
];

function formatValue(
  key: (typeof cards)[number]['key'],
  summary: MetRepairFinancialSummary,
  format: (typeof cards)[number]['format']
): string {
  const value = summary[key as keyof MetRepairFinancialSummary] as number;
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return formatPercentage(value);
  return String(value);
}

export function BusinessHealthCards({ summary }: BusinessHealthCardsProps) {
  return (
    <section aria-label="Business health" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(card => (
        <Card key={card.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatValue(card.key, summary, card.format)}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
