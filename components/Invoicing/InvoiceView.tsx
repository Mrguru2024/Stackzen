import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui';
import { Download, Mail, CreditCard } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface InvoiceViewProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
  onSend: (id: string) => void;
  onPay: (id: string) => void;
}

const PaymentForm = ({ invoice, onSuccess }: { invoice: any; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/invoices/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      console.error('Payment error:', error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full" disabled={!stripe || isProcessing}>
        {isProcessing ? 'Processing...' : `Pay $${invoice.total}`}
      </Button>
    </form>
  );
};

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, isOpen, onClose, onSend, onPay }) => {
  const [showPayment, setShowPayment] = React.useState(false);
  const [paymentIntent, setPaymentIntent] = React.useState<any>(null);

  const handlePayClick = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/create-payment-intent`, {
        method: 'POST',
      });
      const data = await response.json();
      setPaymentIntent(data);
      setShowPayment(true);
    } catch (error) {
      console.error('Error creating payment intent:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Invoice #{invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Header */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">From</h3>
              <div className="text-base">
                <p className="font-semibold">Your Company Name</p>
                <p>123 Business Street</p>
                <p>City, State 12345</p>
                <p>company@example.com</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Bill To</h3>
              <div className="text-base">
                <p className="font-semibold">{invoice.clientName}</p>
                {invoice.clientEmail && <p>{invoice.clientEmail}</p>}
              </div>
            </div>
          </div>

          {/* Status and Details */}
          <Card className="p-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <Badge variant={invoice.paid ? 'success' : 'warning'}>
                  {invoice.paid ? 'Paid' : 'Unpaid'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Invoice Date</p>
                <p className="font-medium">{format(new Date(invoice.createdAt), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                <p className="font-medium">{format(new Date(invoice.dueDate), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount Due</p>
                <p className="text-lg font-bold">${invoice.total}</p>
              </div>
            </div>
          </Card>

          {/* Line Items */}
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {invoice.lineItems.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="whitespace-nowrap px-6 py-4">{item.description}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">{item.quantity}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      ${item.unitPrice.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      ${item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td colSpan={3} className="px-6 py-4 text-right font-medium">
                    Total
                  </td>
                  <td className="px-6 py-4 text-right text-lg font-bold">${invoice.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-2 gap-8">
              {invoice.notes && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Notes
                  </h3>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Terms
                  </h3>
                  <p className="text-sm">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment Section */}
          {!invoice.paid && !showPayment && (
            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Payment Required</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please complete the payment to mark this invoice as paid
                  </p>
                </div>
                <Button onClick={handlePayClick} className="bg-primary hover:bg-primary/90">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </Button>
              </div>
            </div>
          )}

          {/* Stripe Payment Form */}
          {showPayment && paymentIntent && (
            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
              <Elements
                stripe={stripePromise}
                options={{ clientSecret: paymentIntent.clientSecret }}
              >
                <PaymentForm
                  invoice={invoice}
                  onSuccess={() => {
                    setShowPayment(false);
                    onClose();
                  }}
                />
              </Elements>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            {!invoice.paid && (
              <Button variant="outline" onClick={() => onSend(invoice.id)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Invoice
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceView;
