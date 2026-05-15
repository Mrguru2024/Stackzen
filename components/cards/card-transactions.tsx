import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { Icons } from '@/components/ui/icons';

export interface CardTransaction {
  id: string;
  cardName: string;
  cardType: string;
  merchant: string;
  category: string;
  amount: number;
  currency: string;
  transactionDate: string;
  isPending: boolean;
  isRefund: boolean;
  rewardsEarned: number;
}

interface CardTransactionsProps {
  limit?: number;
}

const mockTransactions: CardTransaction[] = [
  {
    id: '1',
    cardName: 'Chase Sapphire Preferred',
    cardType: 'credit',
    merchant: 'Amazon',
    category: 'Shopping',
    amount: 120.45,
    currency: 'USD',
    transactionDate: '2024-06-01T10:30:00Z',
    isPending: false,
    isRefund: false,
    rewardsEarned: 2.4,
  },
  {
    id: '2',
    cardName: 'Amex Gold Card',
    cardType: 'credit',
    merchant: 'Whole Foods',
    category: 'Groceries',
    amount: 85.99,
    currency: 'USD',
    transactionDate: '2024-05-30T14:15:00Z',
    isPending: false,
    isRefund: false,
    rewardsEarned: 1.7,
  },
  {
    id: '3',
    cardName: 'Chase Debit Card',
    cardType: 'debit',
    merchant: 'Starbucks',
    category: 'Coffee',
    amount: 5.25,
    currency: 'USD',
    transactionDate: '2024-05-29T09:00:00Z',
    isPending: false,
    isRefund: false,
    rewardsEarned: 0,
  },
  {
    id: '4',
    cardName: 'Ally Bank Debit',
    cardType: 'debit',
    merchant: 'Uber',
    category: 'Transport',
    amount: 18.75,
    currency: 'USD',
    transactionDate: '2024-05-28T20:45:00Z',
    isPending: true,
    isRefund: false,
    rewardsEarned: 0,
  },
];

export const CardTransactions: React.FC<CardTransactionsProps> = ({ limit }) => {
  const transactions = limit ? mockTransactions.slice(0, limit) : mockTransactions;

  if (transactions.length === 0) {
    return <div className="text-muted-foreground">No transactions found.</div>;
  }

  return (
    <div className="divide-y divide-muted-foreground/10 dark:divide-muted-foreground/20">
      {transactions.map(tx => (
        <div key={tx.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Icons.creditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {tx.merchant} <span className="text-xs text-muted-foreground">({tx.category})</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {tx.cardName} &bull; {new Date(tx.transactionDate).toLocaleDateString()}
                {tx.isPending && (
                  <Badge className="ml-2" variant="warning">
                    Pending
                  </Badge>
                )}
                {tx.isRefund && (
                  <Badge className="ml-2" variant="outline">
                    Refund
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-semibold">
              {tx.isRefund ? '-' : ''}${tx.amount.toFixed(2)} {tx.currency}
            </span>
            {tx.rewardsEarned > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400">
                +{tx.rewardsEarned} pts
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
