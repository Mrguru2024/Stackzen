'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CreditCardList } from './credit-card-list';
import { DebitCardList } from './debit-card-list';
import { CardTransactions } from './card-transactions';
import { AddCardDialog } from './add-card-dialog';
import { Icons } from '@/components/ui/icons';

interface CardStats {
  totalCreditCards: number;
  totalDebitCards: number;
  totalCreditLimit: number;
  totalAvailableCredit: number;
  totalCurrentBalance: number;
  totalRewardsEarned: number;
  recentTransactions: number;
}

export default function CardsComponent() {
  const [stats, setStats] = useState<CardStats>({
    totalCreditCards: 0,
    totalDebitCards: 0,
    totalCreditLimit: 0,
    totalAvailableCredit: 0,
    totalCurrentBalance: 0,
    totalRewardsEarned: 0,
    recentTransactions: 0,
  });
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    _fetchCardStats();
  }, []);

  const _fetchCardStats = async () => {
    try {
      const response = await fetch('/api/cards/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching card stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const _formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cards</h1>
          <p className="text-muted-foreground">
            Manage your credit and debit cards, track spending, and earn rewards
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button onClick={() => setIsAddCardOpen(true)}>
            <Icons.plus className="mr-2 h-4 w-4" />
            Add Card
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Cards</CardTitle>
            <Icons.creditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreditCards}</div>
            <p className="text-xs text-muted-foreground">Active cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
            <Icons.trendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{_formatCurrency(stats.totalCreditLimit)}</div>
            <p className="text-xs text-muted-foreground">
              Available: {_formatCurrency(stats.totalAvailableCredit)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Icons.dollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{_formatCurrency(stats.totalCurrentBalance)}</div>
            <p className="text-xs text-muted-foreground">Across all cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
            <Icons.gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{_formatCurrency(stats.totalRewardsEarned)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credit-cards">Credit Cards</TabsTrigger>
          <TabsTrigger value="debit-cards">Debit Cards</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Credit Cards</CardTitle>
                <CardDescription>Manage your credit cards and track spending</CardDescription>
              </CardHeader>
              <CardContent>
                <CreditCardList compact />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Debit Cards</CardTitle>
                <CardDescription>View your debit cards and linked accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <DebitCardList compact />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest activity across all your cards</CardDescription>
            </CardHeader>
            <CardContent>
              <CardTransactions limit={5} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit-cards" className="space-y-4">
          <CreditCardList />
        </TabsContent>

        <TabsContent value="debit-cards" className="space-y-4">
          <DebitCardList />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <CardTransactions />
        </TabsContent>
      </Tabs>

      <AddCardDialog
        open={isAddCardOpen}
        onOpenChange={setIsAddCardOpen}
        onSuccess={_fetchCardStats}
      />
    </div>
  );
}
