import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { MetRepairInvoice } from '@/lib/integrations/met-repairs/types';

interface UnpaidInvoicesPanelProps {
  invoices: MetRepairInvoice[];
}

export function UnpaidInvoicesPanel({ invoices }: UnpaidInvoicesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Unpaid invoices</CardTitle>
        <CardDescription>Open balances and due dates from MET Repairs OS.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unpaid invoices right now.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Invoice</th>
                <th className="pb-2 pr-4 font-medium">Client</th>
                <th className="pb-2 pr-4 font-medium">Total</th>
                <th className="pb-2 pr-4 font-medium">Paid</th>
                <th className="pb-2 pr-4 font-medium">Balance</th>
                <th className="pb-2 pr-4 font-medium">Due date</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{inv.invoiceLabel}</td>
                  <td className="py-2.5 pr-4">{inv.clientName}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(inv.total)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(inv.paid)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{formatCurrency(inv.balance)}</td>
                  <td className="py-2.5 pr-4">
                    {inv.dueDate ? formatDate(inv.dueDate, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="py-2.5">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
