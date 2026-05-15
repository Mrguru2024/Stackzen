import React, { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard } from 'lucide-react';
import { createInvoiceSchema, type CreateInvoiceFormValues } from '../types.ts';
import InvoicePreview from '../InvoicePreview.tsx';
import { calculateInvoiceTotal, generateInvoicePDF } from '@/lib/utils/invoice';
import { fetchClients, createClient } from '@/lib/api/clients';

interface InvoiceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialClientId?: string | null;
  documentType: 'invoice' | 'quote';
  setDocumentType: (type: 'invoice' | 'quote') => void;
}

const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({
  open,
  onOpenChange,
  initialClientId,
  documentType,
  setDocumentType,
}) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId || null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  // Fetch clients when modal opens
  useEffect(() => {
    if (open) {
      fetchClients()
        .then(data => setClients(data))
        .catch(() => setClients([]));
    }
  }, [open]);

  // Pre-select client if initialClientId changes
  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId]);

  const form = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    const updatedLineItems = [...lineItems];
    updatedLineItems.splice(index, 1);
    setLineItems(updatedLineItems);
    const newTotal = updatedLineItems.reduce((acc, item) => acc + item.amount, 0);
    form.setValue('total', newTotal.toString());
  };

  const updateLineItem = (index: number, field: keyof (typeof lineItems)[0], value: any) => {
    const updatedLineItems = [...lineItems];
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [field]: value,
    };
    if (field === 'quantity' || field === 'unitPrice') {
      updatedLineItems[index].amount =
        updatedLineItems[index].quantity * updatedLineItems[index].unitPrice;
    }
    setLineItems(updatedLineItems);
    const newTotal = updatedLineItems.reduce((acc, item) => acc + item.amount, 0);
    form.setValue('total', newTotal.toString());
    form.setValue('lineItems', updatedLineItems);
  };

  const handleClientSelect = (value: string) => {
    if (value === '__new__') {
      setShowNewClientForm(true);
    } else {
      setSelectedClientId(value);
      setShowNewClientForm(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName || !newClientEmail) return;
    try {
      const client = await createClient(newClientName, newClientEmail);
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

  const onSubmit = async (data: CreateInvoiceFormValues) => {
    // Implement your invoice creation logic here
    toast({ title: 'Invoice Created', description: 'Invoice has been created.' });
    onOpenChange(false);
  };

  // PDF Download Handler
  const handleDownloadPDF = async () => {
    await generateInvoicePDF(
      'invoice-preview',
      `invoice-${form.watch('invoiceNumber') || 'preview'}.pdf`
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-auto max-h-screen w-full max-w-full overflow-y-auto bg-white p-4 text-gray-900 dark:bg-gray-800 dark:text-gray-100 sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Create New {documentType === 'quote' ? 'Quote' : 'Invoice'}
          </DialogTitle>
          <DialogDescription className="text-gray-700 dark:text-gray-300">
            Fill in the details below to create a new{' '}
            {documentType === 'quote' ? 'quote' : 'invoice'}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Document Type Select */}
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="quote">Quote</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Choose whether to create an Invoice or a Quote.</FormDescription>
                </FormItem>
              )}
            />

            <div className="mb-4">
              <FormLabel className="text-gray-700 dark:text-gray-200">Client</FormLabel>
              <Select onValueChange={handleClientSelect} value={selectedClientId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.email && `(${client.email})`}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Add New Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* New Client Form */}
            {showNewClientForm && (
              <div className="space-y-4 rounded-lg border p-4">
                <div>
                  <FormLabel>Client Name</FormLabel>
                  <Input
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <FormLabel>Client Email</FormLabel>
                  <Input
                    value={newClientEmail}
                    onChange={e => setNewClientEmail(e.target.value)}
                    placeholder="Enter client email"
                    type="email"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateClient}
                  disabled={!newClientName.trim()}
                >
                  Create Client
                </Button>
              </div>
            )}

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={date => date < new Date() || date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Line Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
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
                {lineItems.map((item, index) => (
                  <div key={index} className="mb-4 grid grid-cols-12 gap-4">
                    <div className="col-span-5">
                      <Input
                        value={item.description}
                        onChange={e => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateLineItem(index, 'quantity', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e =>
                          updateLineItem(index, 'unitPrice', parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min="0" step="0.01" value={item.amount} readOnly />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create {documentType === 'invoice' ? 'Invoice' : 'Quote'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceFormModal;
