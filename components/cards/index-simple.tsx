'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Icons } from '@/components/ui/icons';

export default function CardsComponentSimple() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cards</h1>
          <p className="text-muted-foreground">
            Manage your credit and debit cards, track spending, and earn rewards
          </p>
        </div>
        <Button>
          <Icons.plus className="mr-2 h-4 w-4" />
          Add Card
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Credit cards content will go here</p>
        </CardContent>
      </Card>
    </div>
  );
}
