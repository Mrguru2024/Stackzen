'use client';

import React from 'react';
import Link from 'next/link';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/ui';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import type { StripeConnectStatus } from '@/components/StripeConnectCard';
import { CircleDollarSign } from 'lucide-react';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<{ id: string; name: string; email: string }[]>([]);
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [enableOnlinePayment, setEnableOnlinePayment] = useState(true);
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/clients');
        if (!res.ok) throw new Error('Failed to fetch clients');
        const data = await res.json();
        setClients(data);
      } catch (err) {
        setError('Could not load clients.');
      }
    }
    async function fetchStripeStatus() {
      try {
        const res = await fetch('/api/stripe/connect/status');
        if (!res.ok) return;
        setStripeStatus(await res.json());
      } catch {
        // non-fatal
      }
    }
    fetchClients();
    fetchStripeStatus();
  }, []);

  const stripeReady = stripeStatus?.status === 'active';

  const handleLineItemChange = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: field === 'description' ? value : Number(value) } : item
      )
    );
  };

  const handleAddLineItem = () => {
    setLineItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLineItem = (idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !clientId ||
      !dueDate ||
      lineItems.length === 0 ||
      lineItems.some(li => !li.description || li.quantity <= 0 || li.unitPrice < 0)
    ) {
      setError(
        'Please select a client, fill all required fields, and add at least one valid line item.'
      );
      return;
    }
    setIsLoading(true);
    try {
      const dueDateIso = new Date(`${dueDate}T12:00:00.000Z`).toISOString();
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          dueDate: dueDateIso,
          lineItems,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Failed to create invoice');
      }

      const created = (await res.json()) as { id: string };
      if (enableOnlinePayment && stripeReady && created?.id) {
        try {
          await fetch(`/api/invoices/${created.id}/payment-link`, { method: 'POST' });
        } catch {
          // The payment link can be re-generated from the list view if this fails.
        }
      }
      router.push('/income/invoices');
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>New Invoice</CardTitle>
          <CardDescription>Create a new invoice for your client</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="col-span-2">
                <Label>Client *</Label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  required
                  disabled={isLoading || clients.length === 0}
                  aria-label="Client"
                >
                  <option value="" disabled>
                    {clients.length === 0 ? 'Loading clients...' : 'Select a client'}
                  </option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.email ? `(${client.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <CircleDollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Make this invoice payable online</Label>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We'll generate a Stripe-hosted payment page and email it to your client.
                      They can pay by card, Apple Pay, or bank transfer in seconds.
                    </p>
                    {!stripeReady && (
                      <p className="mt-2 text-sm">
                        <Link
                          href="/settings/payments"
                          className="font-medium text-primary underline"
                        >
                          Connect Stripe
                        </Link>{' '}
                        to enable online payments.
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={enableOnlinePayment && stripeReady}
                  disabled={!stripeReady}
                  onCheckedChange={setEnableOnlinePayment}
                  aria-label="Enable online payment"
                />
              </div>
            </div>

            <div>
              <Label>Line Items *</Label>
              <div className="space-y-4">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-end gap-2">
                    <Input
                      className="flex-1"
                      placeholder="Description"
                      value={item.description}
                      onChange={e => handleLineItemChange(idx, 'description', e.target.value)}
                      required
                    />
                    <Input
                      type="number"
                      min={1}
                      className="w-20"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={e => handleLineItemChange(idx, 'quantity', e.target.value)}
                      required
                    />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-28"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={e => handleLineItemChange(idx, 'unitPrice', e.target.value)}
                      required
                    />
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLineItem(idx)}
                      >
                        <Icons.x className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddLineItem}
                  className="mt-2"
                >
                  <Icons.plus className="mr-1 h-4 w-4" /> Add Line Item
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="font-semibold">Total:</span>
              <span className="text-lg font-bold">{formatCurrency(total)}</span>
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                'Create Invoice'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
