import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceSummary } from './types.ts';
import { formatCurrency } from '@/lib/utils';

interface InvoiceSummaryCardsProps {
  summary?: InvoiceSummary;
}

const defaultSummary: InvoiceSummary = {
  totalInvoices: 0,
  totalPaid: 0,
  totalOverdue: 0,
  totalDraft: 0,
  totalAmount: 0,
  paidAmount: 0,
  overdueAmount: 0,
  draftAmount: 0,
};

const InvoiceSummaryCards: React.FC<InvoiceSummaryCardsProps> = ({ summary = defaultSummary }) => {
  const _cards = [
    {
      title: 'Total Invoices',
      value: summary.totalInvoices,
      amount: formatCurrency(summary.totalAmount),
      description: 'All invoices',
      className: 'bg-primary/10',
    },
    {
      title: 'Paid',
      value: summary.totalPaid,
      amount: formatCurrency(summary.paidAmount),
      description: 'Paid invoices',
      className: 'bg-green-500/10',
    },
    {
      title: 'Overdue',
      value: summary.totalOverdue,
      amount: formatCurrency(summary.overdueAmount),
      description: 'Overdue invoices',
      className: 'bg-red-500/10',
    },
    {
      title: 'Draft',
      value: summary.totalDraft,
      amount: formatCurrency(summary.draftAmount),
      description: 'Draft invoices',
      className: 'bg-gray-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {_cards.map(card => (
        <Card key={card.title} className={card.className}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xl font-semibold text-muted-foreground">{card.amount}</div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InvoiceSummaryCards;
