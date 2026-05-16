'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type FinancialEvent = {
  id: string;
  type: string;
  source: string;
  amount: number | null;
  currency: string;
  createdAt: string;
};

type TimelineResponse = {
  events: FinancialEvent[];
  nextCursor: string | null;
};

function formatEventType(type: string): string {
  return type
    .toLowerCase()
    .split('_')
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function formatSource(source: string): string {
  return source.replace(/^API_/, '').toLowerCase().replaceAll('_', ' ');
}

export default function FinancialActivityWidget() {
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/financial-events/timeline?limit=6', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) {
        setError('Unable to load recent financial activity.');
        setEvents([]);
        return;
      }

      const payload = (await response.json()) as TimelineResponse;
      setEvents(payload.events ?? []);
    } catch {
      setError('Unable to load recent financial activity.');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  let content: React.ReactElement;
  if (isLoading) {
    content = <p className="text-sm text-muted-foreground">Loading recent activity...</p>;
  } else if (error) {
    content = <p className="text-sm text-destructive">{error}</p>;
  } else if (events.length === 0) {
    content = (
      <p className="text-sm text-muted-foreground">
        No financial events yet. Create an invoice, quote, expense, or update income profiles to start your timeline.
      </p>
    );
  } else {
    content = (
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{formatEventType(event.type)}</p>
              <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Source: {formatSource(event.source)}</span>
              {typeof event.amount === 'number' ? (
                <span>
                  Amount: {event.currency} {event.amount.toFixed(2)}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-lg">Financial Activity</CardTitle>
          <CardDescription>Latest events across invoices, quotes, expenses, and profiles.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadEvents()} disabled={isLoading}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

