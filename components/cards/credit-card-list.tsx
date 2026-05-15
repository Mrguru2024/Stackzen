import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/ui/icons';

export interface CreditCard {
  id: string;
  name: string;
  cardType: string;
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  creditLimit: number;
  availableCredit: number;
  currentBalance: number;
  rewardsType?: string;
  rewardsRate?: number;
  isActive: boolean;
  bank?: string;
}

interface CreditCardListProps {
  compact?: boolean;
}

const mockCreditCards: CreditCard[] = [
  {
    id: '1',
    name: 'Chase Sapphire Preferred',
    cardType: 'Visa',
    lastFourDigits: '1234',
    expiryMonth: 12,
    expiryYear: 2027,
    creditLimit: 15000,
    availableCredit: 12000,
    currentBalance: 3000,
    rewardsType: 'points',
    rewardsRate: 2,
    isActive: true,
    bank: 'Chase',
  },
  {
    id: '2',
    name: 'Amex Gold Card',
    cardType: 'Amex',
    lastFourDigits: '5678',
    expiryMonth: 8,
    expiryYear: 2026,
    creditLimit: 10000,
    availableCredit: 8000,
    currentBalance: 2000,
    rewardsType: 'cashback',
    rewardsRate: 1.5,
    isActive: true,
    bank: 'American Express',
  },
];

export const CreditCardList: React.FC<CreditCardListProps> = ({ compact }) => {
  if (mockCreditCards.length === 0) {
    return <div className="text-muted-foreground">No credit cards found.</div>;
  }

  return (
    <div className="space-y-4">
      {mockCreditCards.map(card => (
        <Card
          key={card.id}
          className="border-0 bg-gradient-to-r from-blue-100 to-blue-50 shadow-md dark:from-blue-900 dark:to-blue-800"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Icons.creditCard className="h-5 w-5 text-blue-500" />
                {card.name}
                {card.isActive ? (
                  <Badge className="ml-2" variant="success">
                    Active
                  </Badge>
                ) : (
                  <Badge className="ml-2" variant="destructive">
                    Inactive
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                {card.bank} &bull; {card.cardType} &bull; **** {card.lastFourDigits}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">
                Exp {card.expiryMonth}/{card.expiryYear}
              </span>
              <span className="text-xs text-muted-foreground">
                Limit: ${card.creditLimit.toLocaleString()}
              </span>
            </div>
          </CardHeader>
          {!compact && (
            <CardContent className="flex flex-col gap-2 pt-0 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm">
                  Available Credit:{' '}
                  <span className="font-semibold">${card.availableCredit.toLocaleString()}</span>
                </div>
                <div className="text-sm">
                  Current Balance:{' '}
                  <span className="font-semibold">${card.currentBalance.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <div className="text-sm">
                  Rewards:{' '}
                  <span className="font-semibold">
                    {card.rewardsType} ({card.rewardsRate ?? 0}%)
                  </span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
