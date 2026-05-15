'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Search,
  Plus,
  FileText,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CircleDollarSign,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { InvoicePaymentLinkButton } from '@/components/InvoicePaymentLinkButton';
import type { StripeConnectStatus } from '@/components/StripeConnectCard';
import { ExecutionContinuityBoundary } from '@/components/operational-execution/ExecutionContinuityBanner';

interface Invoice {
  id: string;
  number: string;
  client: {
    name: string;
    email: string;
    company?: string;
  };
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'pending' | 'failed';
  dueDate: string;
  issueDate: string;
  paymentEnabled?: boolean;
  stripeHostedInvoiceUrl?: string | null;
  items: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  notes?: string;
  isProOnly: boolean;
}

export default function InvoicesManagerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const isPro = user?.subscription?.status === 'active';

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      const response = await fetch('/api/invoices');
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const data = await response.json();
      return data.invoices;
    },
  });

  const { data: stripeStatus } = useQuery<StripeConnectStatus>({
    queryKey: ['stripe-connect-status'],
    queryFn: async () => {
      const response = await fetch('/api/stripe/connect/status');
      if (!response.ok) throw new Error('Failed to load Stripe status');
      return response.json();
    },
    staleTime: 30_000,
  });
  const stripeReady = stripeStatus?.status === 'active';

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch =
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;

    if (activeTab === 'pro') {
      return matchesSearch && matchesStatus && invoice.isProOnly;
    }
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-500';
      case 'sent':
        return 'text-blue-500';
      case 'overdue':
        return 'text-red-500';
      case 'draft':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'draft':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const totalAmount = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const paidAmount =
    invoices?.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.amount : 0), 0) || 0;
  const overdueAmount =
    invoices?.reduce((sum, inv) => sum + (inv.status === 'overdue' ? inv.amount : 0), 0) || 0;

  const handleSendInvoice = async (invoice: Invoice) => {
    if (invoice.isProOnly && !isPro) {
      toast({
        title: 'Upgrade required',
        description: 'This invoice action requires Pro.',
        variant: 'destructive',
      });
      return;
    }

    setSendingInvoiceId(invoice.id);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send`, {
        method: 'POST',
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Failed to send invoice');
      }

      toast({
        title: 'Invoice sent',
        description: `Invoice ${invoice.number} was sent successfully.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Send failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (invoice.isProOnly && !isPro) {
      toast({
        title: 'Upgrade required',
        description: 'This invoice action requires Pro.',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingInvoiceId(invoice.id);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/download`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Failed to download invoice');
      }

      const blob = await response.blob();
      const fileUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = fileUrl;
      anchor.download = `invoice-${invoice.number}.pdf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(fileUrl);
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  return (
    <div className="container mx-auto space-y-8 py-6">
      <ExecutionContinuityBoundary />
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices Manager</h1>
          <p className="text-muted-foreground">
            Create, track, and manage your invoices and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push('/invoices/new?mode=template')}
          >
            <FileText size={16} />
            Templates
          </Button>
          <Button className="gap-2" onClick={() => router.push('/invoices/new')}>
            <Plus size={16} />
            New Invoice
          </Button>
        </div>
      </div>

      {stripeStatus && stripeStatus.status !== 'active' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <CircleDollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {stripeStatus.connected
                    ? 'Finish your Stripe setup to start accepting payments'
                    : 'Let clients pay every invoice online'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stripeStatus.connected
                    ? 'Stripe still needs a couple of details before clients can pay your invoices.'
                    : 'Connect Stripe once and every new invoice comes with a one-click payment page for your clients.'}
                </p>
              </div>
            </div>
            <Button asChild className="gap-2">
              <Link href="/settings/payments">
                <Sparkles className="h-4 w-4" />
                {stripeStatus.connected ? 'Continue setup' : 'Connect Stripe'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalAmount.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${paidAmount.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Successfully paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${overdueAmount.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
          <TabsTrigger value="pro">Pro Features</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Online payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices?.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invoice.client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.client.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`flex items-center gap-1 ${getStatusColor(invoice.status)}`}
                        >
                          {getStatusIcon(invoice.status)}
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.status === 'paid' ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                          </Badge>
                        ) : (
                          <InvoicePaymentLinkButton
                            invoiceId={invoice.id}
                            stripeReady={stripeReady}
                            initialPaymentUrl={invoice.stripeHostedInvoiceUrl ?? null}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={invoice.isProOnly && !isPro}
                            onClick={() => void handleDownloadInvoice(invoice)}
                          >
                            {downloadingInvoiceId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={invoice.isProOnly && !isPro}
                            onClick={() => void handleSendInvoice(invoice)}
                          >
                            {sendingInvoiceId === invoice.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
