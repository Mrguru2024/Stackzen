import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { Icons } from '@/components/ui/icons';

export interface DebitCard {
  id: string;
  name: string;
  cardType: string;
  lastFourDigits: string;
  expiryMonth: number;
  expiryYear: number;
  linkedAccount: string;
  dailyLimit: number;
  isActive: boolean;
  bank?: string;
}

interface DebitCardListProps {
  compact?: boolean;
}

const mockDebitCards: DebitCard[] = [
  {
    id: '1',
    name: 'Chase Debit Card',
    cardType: 'Visa',
    lastFourDigits: '4321',
    expiryMonth: 10,
    expiryYear: 2025,
    linkedAccount: 'Chase Checking',
    dailyLimit: 2000,
    isActive: true,
    bank: 'Chase',
  },
  {
    id: '2',
    name: 'Ally Bank Debit',
    cardType: 'Mastercard',
    lastFourDigits: '8765',
    expiryMonth: 3,
    expiryYear: 2026,
    linkedAccount: 'Ally Checking',
    dailyLimit: 1500,
    isActive: true,
    bank: 'Ally',
  },
];

export const DebitCardList: React.FC<DebitCardListProps> = ({ compact }) => {
  if (mockDebitCards.length === 0) {
    return <div className="text-muted-foreground">No debit cards found.</div>;
  }

  return (
    <div className="space-y-4">
      {mockDebitCards.map(card => (
        <Card
          key={card.id}
          className="border-0 bg-gradient-to-r from-green-100 to-green-50 shadow-md dark:from-green-900 dark:to-green-800"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Icons.creditCard className="h-5 w-5 text-green-500" />
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
                Daily Limit: ${card.dailyLimit.toLocaleString()}
              </span>
            </div>
          </CardHeader>
          {!compact && (
            <CardContent className="flex flex-col gap-2 pt-0 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm">
                  Linked Account: <span className="font-semibold">{card.linkedAccount}</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
