'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// TODO: Replace with actual API client and hooks
// import { queryClient, apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import {
  createInvoiceSchema,
  type CreateInvoiceFormValues,
  type Invoice,
  type InvoiceSummary,
} from './types';
import InvoiceSummaryCards from './InvoiceSummaryCards';
import InvoiceTable from './InvoiceTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useForm as useEditForm } from 'react-hook-form';
import InvoicePreview from './InvoicePreview';
import { loadStripe, PaymentIntent } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard } from 'lucide-react';
import dynamic from 'next/dynamic';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const _INVOICE_STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Sent', value: 'sent' },
];

const InvoiceFormModal = dynamic(() => import('./InvoiceFormModal'), {
  ssr: false,
  loading: () => <div>Loading invoice form...</div>,
});

const Invoicing: React.FC = () => {
  const { toast } = useToast();
  const _queryClient = useQueryClient();
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState<'invoice' | 'quote'>('invoice');
  const { data: session } = useSession();

  // --- Client selection state ---
  const [clients, setClients] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Fetch clients
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const _response = await fetch('/api/clients');
      if (!_response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return _response.json();
    },
    enabled: isCreatingInvoice,
  });

  useEffect(() => {
    if (clientsData) {
      setClients(clientsData);
    }
  }, [clientsData]);

  // Fetch invoices with loading state
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', page, limit, status, search],
    queryFn: async () => {
      const _params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(search && { search }),
      });
      const _response = await fetch(`/api/invoices?${_params}`);
      if (!_response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      return _response.json();
    },
  });

  // Create invoice mutation
  const _createInvoice = useMutation({
    mutationFn: async (data: CreateInvoiceFormValues) => {
      if (!selectedClientId) {
        throw new Error('Please select a client');
      }

      const _response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          client: {
            connect: {
              id: selectedClientId,
            },
          },
        }),
      });
      if (!_response.ok) {
        const error = await _response.json();
        throw new Error(error.message || 'Failed to create invoice');
      }
      return _response.json();
    },
    onSuccess: () => {
      _queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
      setIsCreatingInvoice(false);
      setSelectedClientId(null);
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });

  // Delete invoice mutation
  const _deleteInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const _response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      if (!_response.ok) {
        throw new Error('Failed to delete invoice');
      }
    },
    onSuccess: () => {
      _queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete invoice',
        variant: 'destructive',
      });
    },
  });

  // Send invoice mutation
  const _sendInvoice = useMutation({
    mutationFn: async (invoiceId: string) => {
      const _response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      });
      if (!_response.ok) {
        throw new Error('Failed to send invoice');
      }
    },
    onSuccess: () => {
      _queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice sent successfully',
      });
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invoice',
        variant: 'destructive',
      });
    },
  });

  const [lineItems, setLineItems] = useState<
    {
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }[]
  >([{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]);

  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      paymentMethod: 'online',
      paymentDetails: {
        stripeEnabled: true,
        bankAccount: '',
        cashInstructions: '',
        checkPayableTo: '',
      },
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
      total: '0',
    },
  });

  // Function to add a line item
  const _addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  // Function to remove a line item
  const _removeLineItem = (index: number) => {
    const _updatedLineItems = [...lineItems];
    _updatedLineItems.splice(index, 1);
    setLineItems(_updatedLineItems);

    // Calculate new total
    const _newTotal = _updatedLineItems.reduce((acc, item) => acc + item.amount, 0);
    form.setValue('total', _newTotal.toString());
  };

  // Function to update line item and recalculate amount and total
  const _updateLineItem = (index: number, field: keyof (typeof lineItems)[0], value: any) => {
    const _updatedLineItems = [...lineItems];
    _updatedLineItems[index] = {
      ..._updatedLineItems[index],
      [field]: value,
    };

    // Recalculate amount if quantity or unitPrice changed
    if (field === 'quantity' || field === 'unitPrice') {
      _updatedLineItems[index].amount =
        _updatedLineItems[index].quantity * _updatedLineItems[index].unitPrice;
    }

    setLineItems(_updatedLineItems);

    // Calculate new total
    const _newTotal = _updatedLineItems.reduce((acc, item) => acc + item.amount, 0);
    form.setValue('total', _newTotal.toString());

    // Update form values
    form.setValue('lineItems', _updatedLineItems);
  };

  // Function to handle form submission
  const onSubmit = async (data: CreateInvoiceFormValues) => {
    if (documentType === 'invoice') {
      try {
        // Create invoice
        const _response = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!_response.ok) {
          throw new Error('Failed to create invoice');
        }

        const invoice = await _response.json();

        // Handle payment based on method
        if (data.paymentMethod === 'online' && data.paymentDetails?.stripeEnabled) {
          try {
            const _payRes = await fetch(`/api/invoices/${invoice.id}/pay`, { method: 'POST' });
            if (!_payRes.ok) {
              const _payError = await _payRes.text();
              toast({
                title: 'Stripe Error',
                description: _payError || 'Failed to initiate Stripe payment',
                variant: 'destructive',
              });
              return;
            }
            const { url } = await _payRes.json();
            if (url) {
              window.location.href = url;
            }
          } catch (err) {
            toast({
              title: 'Stripe Error',
              description: err instanceof Error ? err.message : 'Failed to initiate Stripe payment',
              variant: 'destructive',
            });
          }
        } else {
          // For other payment methods, just show success
          toast({
            title: 'Success',
            description: 'Invoice created successfully',
          });
          _queryClient.invalidateQueries({ queryKey: ['invoices'] });
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to create invoice',
          variant: 'destructive',
        });
      }
    } else if (documentType === 'quote') {
      // Create a quote in the database
      try {
        const _response = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: (session?.user as any)?.id,
            title: data.invoiceNumber || 'Quote',
            content: JSON.stringify(data), // Store the form data as content
            status: 'draft',
          }),
        });
        if (!_response.ok) throw new Error('Failed to create quote');
        toast({ title: 'Quote created', description: 'Your quote has been saved.' });
        setIsCreatingInvoice(false);
        // Optionally, refresh quotes list or redirect
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to create quote.' });
      }
    }
  };

  const _handleClientSelect = (value: string) => {
    if (value === '__new__') {
      setShowNewClientForm(true);
    } else {
      setSelectedClientId(value);
      setShowNewClientForm(false);
    }
  };

  const _handleCreateClient = async () => {
    if (!newClientName || !newClientEmail) return;
    try {
      const _res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClientName, email: newClientEmail }),
      });
      if (!_res.ok) throw new Error('Failed to create client');
      const client = await _res.json();
      setClients(prev => [...prev, client]);
      setSelectedClientId(client.id);
      setShowNewClientForm(false);
      setNewClientName('');
      setNewClientEmail('');
      toast({ title: 'Client created', description: `${client.name} added.` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create client', variant: 'destructive' });
    }
  };

  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  // Edit form instance
  const _editForm = useEditForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: editInvoice
      ? {
          clientId: editInvoice.clientId || '',
          clientName: editInvoice.clientName || '',
          clientEmail: editInvoice.clientEmail || '',
          invoiceNumber: editInvoice.invoiceNumber || '',
          dueDate: editInvoice.dueDate ? new Date(editInvoice.dueDate) : new Date(),
          status: editInvoice.status || 'draft',
          terms: editInvoice.terms || '',
          total: editInvoice.total?.toString() || '0',
          paymentMethod: 'online',
          paymentDetails: {
            stripeEnabled: true,
            bankAccount: '',
            cashInstructions: '',
            checkPayableTo: '',
          },
          lineItems: (editInvoice.lineItems || []).map(item => ({
            description: item.description ?? '',
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? 0,
            amount: item.amount ?? 0,
            id: item.id ?? Math.random().toString(36),
          })),
          notes: editInvoice.notes || '',
        }
      : {
          clientId: '',
          clientName: '',
          clientEmail: '',
          invoiceNumber: '',
          dueDate: new Date(),
          status: 'draft',
          terms: '',
          total: '0',
          paymentMethod: 'online',
          paymentDetails: {
            stripeEnabled: true,
            bankAccount: '',
            cashInstructions: '',
            checkPayableTo: '',
          },
          lineItems: [
            {
              description: '',
              quantity: 1,
              unitPrice: 0,
              amount: 0,
              id: Math.random().toString(36),
            },
          ],
          notes: '',
        },
  });

  // Update invoice mutation
  const _updateInvoice = useMutation({
    mutationFn: async (data: CreateInvoiceFormValues) => {
      if (!editInvoice) throw new Error('No invoice selected');
      const _response = await fetch(`/api/invoices/${editInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          client: {
            connect: {
              id: editInvoice.clientId,
            },
          },
        }),
      });
      if (!_response.ok) {
        const error = await _response.json();
        throw new Error(error.message || 'Failed to update invoice');
      }
      return _response.json();
    },
    onSuccess: () => {
      _queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
      setEditInvoice(null);
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update invoice',
        variant: 'destructive',
      });
    },
  });

  const [paymentIntent, setPaymentIntent] = useState<
    (PaymentIntent & { invoiceId: string }) | null
  >(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const _createPaymentIntent = useMutation({
    mutationFn: async (invoiceId: string) => {
      const _response = await fetch(`/api/invoices/${invoiceId}/create-payment-intent`, {
        method: 'POST',
      });
      if (!_response.ok) {
        throw new Error('Failed to create payment intent');
      }
      return _response.json();
    },
    onSuccess: data => {
      setPaymentIntent(data);
      setShowPaymentModal(true);
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create payment intent',
        variant: 'destructive',
      });
    },
  });

  const PaymentModal = ({ invoice, onSuccess }: { invoice: Invoice; onSuccess: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setIsProcessing(true);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements: elements,
        confirmParams: {
          return_url: `${window.location.origin}/invoices/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: 'Payment Successful',
          description: 'Your invoice has been paid successfully.',
        });
        onSuccess();
        setShowPaymentModal(false);
      }

      setIsProcessing(false);
    };

    return (
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pay Invoice #{invoice.invoiceNumber}</DialogTitle>
            <DialogDescription>Amount to pay: ${invoice.total}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <PaymentElement />
            </div>
            <Button type="submit" className="w-full" disabled={!stripe || isProcessing}>
              {isProcessing ? 'Processing...' : `Pay $${invoice.total}`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error instanceof Error ? error.message : 'Failed to load invoices'}</div>;
  }

  const { invoices, pagination, summary } = data || {
    invoices: [],
    pagination: null,
    summary: {
      totalInvoices: 0,
      totalPaid: 0,
      totalOverdue: 0,
      totalDraft: 0,
      totalAmount: 0,
      paidAmount: 0,
      overdueAmount: 0,
      draftAmount: 0,
    },
  };

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Invoices</h1>
        <Button
          className="transform rounded-lg bg-primary px-6 py-2 font-medium text-white shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg active:translate-y-0"
          onClick={() => setIsCreatingInvoice(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>

        {/* Create Invoice Dialog */}
        <InvoiceFormModal
          open={isCreatingInvoice}
          onOpenChange={setIsCreatingInvoice}
          documentType={documentType}
          setDocumentType={setDocumentType}
        />
      </div>

      <div className="space-y-8">
        <InvoiceSummaryCards summary={summary} />

        <div className="mb-4 flex items-center gap-4">
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={status || 'all'}
            onValueChange={value => setStatus(value === 'all' ? '' : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <InvoiceTable
          invoices={invoices}
          onView={setViewInvoice}
          onEdit={setEditInvoice}
          onDelete={invoice => {
            if (window.confirm('Are you sure you want to delete this invoice?')) {
              _deleteInvoice.mutate(invoice.id);
            }
          }}
          onSend={invoice => {
            if (window.confirm('Are you sure you want to send this invoice?')) {
              _sendInvoice.mutate(invoice.id);
            }
          }}
        />

        {pagination && pagination.pages > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div>
                <strong>Invoice #:</strong> {viewInvoice.invoiceNumber}
              </div>
              <div>
                <strong>Client:</strong> {viewInvoice.clientName} ({viewInvoice.clientEmail})
              </div>
              <div>
                <strong>Due Date:</strong> {format(new Date(viewInvoice.dueDate), 'PPP')}
              </div>
              <div>
                <strong>Status:</strong> {viewInvoice.paid ? 'Paid' : 'Unpaid'}
              </div>
              <div>
                <strong>Amount:</strong> $
                {(viewInvoice.total ?? viewInvoice.amount ?? 0).toFixed(2)}
              </div>
              <div>
                <strong>Line Items:</strong>
                <ul className="ml-6 list-disc">
                  {viewInvoice.lineItems.map(item => (
                    <li key={item.id}>
                      {item.description} — {item.quantity} × ${item.unitPrice} = ${item.amount}
                    </li>
                  ))}
                </ul>
              </div>
              {viewInvoice.notes && (
                <div>
                  <strong>Notes:</strong> {viewInvoice.notes}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={!!editInvoice} onOpenChange={() => setEditInvoice(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>Edit the details of your invoice below.</DialogDescription>
          </DialogHeader>
          {editInvoice && (
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <Form {..._editForm}>
                  <form
                    onSubmit={_editForm.handleSubmit(data => {
                      // Calculate total from line items
                      const total = data.lineItems.reduce(
                        (sum, item) => sum + (item.amount || 0),
                        0
                      );
                      _updateInvoice.mutate({
                        ...data,
                        clientId: editInvoice.clientId,
                        total: total.toString(),
                      });
                    })}
                    className="space-y-6"
                  >
                    {/* Client Info - Read Only */}
                    <div className="space-y-2">
                      <FormLabel>Client Information</FormLabel>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Client Name:
                            </span>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                              {editInvoice.clientName}
                            </p>
                          </div>
                          {editInvoice.clientEmail && (
                            <div>
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Client Email:
                              </span>
                              <p className="text-base text-gray-900 dark:text-gray-100">
                                {editInvoice.clientEmail}
                              </p>
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Client ID:
                            </span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {editInvoice.clientId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={_editForm.control}
                        name="invoiceNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Invoice Number</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={_editForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                  type="button"
                                >
                                  {field.value ? (
                                    format(field.value, 'PPP')
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={date =>
                                    date < new Date() || date < new Date('1900-01-01')
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Status field */}
                    <FormField
                      control={_editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? 'draft'}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Terms field */}
                    <FormField
                      control={_editForm.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Notes field */}
                    <FormField
                      control={_editForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Editable line items */}
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium">Line Items</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const items = _editForm.getValues('lineItems') || [];
                            _editForm.setValue('lineItems', [
                              ...items,
                              { description: '', quantity: 1, unitPrice: 0, amount: 0 },
                            ]);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </div>
                      <div className="rounded-md border p-4">
                        <div className="mb-2 grid grid-cols-12 gap-4 font-medium">
                          <div className="col-span-5">Description</div>
                          <div className="col-span-2">Quantity</div>
                          <div className="col-span-2">Unit Price</div>
                          <div className="col-span-2">Amount</div>
                          <div className="col-span-1"></div>
                        </div>
                        {_editForm.watch('lineItems')?.map((item, index) => (
                          <div key={index} className="mb-4 grid grid-cols-12 gap-4">
                            <FormField
                              control={_editForm.control}
                              name={`lineItems.${index}.description`}
                              render={({ field }) => (
                                <FormItem className="col-span-5">
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Item description" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={_editForm.control}
                              name={`lineItems.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormLabel>Quantity</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="1" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={_editForm.control}
                              name={`lineItems.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormLabel>Unit Price</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" min="0" step="0.01" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormItem className="col-span-2">
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input type="number" value={item.amount} readOnly />
                              </FormControl>
                            </FormItem>
                            <div className="col-span-1 flex items-center">
                              {_editForm.watch('lineItems').length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const items = [...(_editForm.getValues('lineItems') || [])];
                                    items.splice(index, 1);
                                    _editForm.setValue('lineItems', items);
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90"
                        disabled={_updateInvoice.isPending}
                      >
                        {_updateInvoice.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </div>

              {/* Preview Section */}
              <div className="border-l border-gray-200 pl-8 dark:border-gray-700">
                <h3 className="mb-4 text-lg font-medium">Client Preview</h3>
                <div className="sticky top-4">
                  <InvoicePreview
                    data={{
                      invoiceNumber: _editForm.watch('invoiceNumber') || '',
                      dueDate: _editForm.watch('dueDate') || new Date(),
                      clientName: editInvoice.clientName,
                      clientEmail: editInvoice.clientEmail || null,
                      lineItems: _editForm.watch('lineItems') || [],
                      total:
                        _editForm
                          .watch('lineItems')
                          ?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
                      notes: _editForm.watch('notes'),
                      terms: _editForm.watch('terms'),
                    }}
                    companyInfo={{
                      name: 'Your Company',
                      email: 'company@example.com',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {paymentIntent && (
        <PaymentModal
          invoice={invoices.find((inv: Invoice) => inv.id === paymentIntent.invoiceId)!}
          onSuccess={() => {
            _queryClient.invalidateQueries({ queryKey: ['invoices'] });
            setPaymentIntent(null);
          }}
        />
      )}
    </div>
  );
};

const InvoicingWithStripe: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <Invoicing />
    </Elements>
  );
};

export default InvoicingWithStripe;
