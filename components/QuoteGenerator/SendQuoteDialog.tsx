import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Plus } from 'lucide-react';

interface QuoteBreakdown {
  laborCost: number;
  materialsCost: number;
  travelCost: number;
  overheadCost: number;
  profitMargin: number;
  totalCost: number;
  suggestedPrice: number;
  netProfit: number;
}

interface QuoteOption {
  tier: 'basic' | 'standard' | 'premium';
  name: string;
  price: number;
  features: string[];
  valueProps: string[];
  warranty: string;
  responseTime: string;
  additionalServices: string[];
  breakdown: QuoteBreakdown;
}

interface SendQuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuote: QuoteOption | null;
  customerEmail: string;
  customerPhone: string;
  preferredContactMethod: 'email' | 'sms';
  onSend: (method: 'email' | 'sms', contact: string) => void;
}

export const SendQuoteDialog: React.FC<SendQuoteDialogProps> = ({
  isOpen,
  onClose,
  selectedQuote,
  customerEmail,
  customerPhone,
  preferredContactMethod,
  onSend,
}) => {
  const [method, setMethod] = useState<'email' | 'sms'>(preferredContactMethod);
  const [contact, setContact] = useState(customerEmail || customerPhone || '');

  if (!selectedQuote) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${isOpen ? '' : 'hidden'}`}
    >
      <div className="mx-4 max-h-[90vh] w-full max-w-[1200px] overflow-y-auto rounded-xl bg-white p-8 dark:bg-gray-900">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">Send Quote to Customer</h3>
          <button
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-700"
            aria-label="Close dialog"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Customer Quote Preview */}
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-900 dark:bg-gray-900">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
              <div className="mb-2 text-center">
                <h4 className="mb-2 text-3xl font-bold">Service Quote</h4>
                <p className="text-blue-100">Thank you for your interest in our services</p>
              </div>
            </div>

            <div className="space-y-8 p-8">
              {/* Package Details */}
              <div className="rounded-lg bg-gray-50 p-6 dark:bg-gray-900">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h5 className="mb-2 text-2xl font-semibold capitalize text-gray-900">
                      {selectedQuote.tier} Package
                    </h5>
                    <p className="text-gray-600">Comprehensive service solution</p>
                  </div>
                  <span className="text-4xl font-bold text-blue-600">
                    ${selectedQuote.breakdown.suggestedPrice.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                    <p className="mb-2 text-sm text-gray-600">Response Time</p>
                    <p className="text-lg font-medium">{selectedQuote.responseTime}</p>
                  </div>
                  <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                    <p className="mb-2 text-sm text-gray-600">Warranty Period</p>
                    <p className="text-lg font-medium">{selectedQuote.warranty}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <h5 className="mb-4 text-xl font-semibold text-gray-900">What&apos;s Included:</h5>
                <ul className="grid grid-cols-1 gap-4">
                  {selectedQuote.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-green-500" />
                      <span className="text-lg text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Additional Services */}
              {selectedQuote.additionalServices.length > 0 && (
                <div className="rounded-lg border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                  <h5 className="mb-4 text-xl font-semibold text-gray-900">Additional Services:</h5>
                  <ul className="grid grid-cols-1 gap-4">
                    {selectedQuote.additionalServices.map((service, index) => (
                      <li key={index} className="flex items-start">
                        <Plus className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-blue-500" />
                        <span className="text-lg text-gray-700">{service}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Value Propositions */}
              <div className="rounded-lg bg-blue-50 p-6">
                <h5 className="mb-4 text-xl font-semibold text-blue-900">
                  Why Choose This Package:
                </h5>
                <ul className="grid grid-cols-1 gap-4">
                  {selectedQuote.valueProps.map((prop, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-3 mt-1 text-blue-500">•</span>
                      <span className="text-lg text-blue-900">{prop}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Call to Action */}
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <p className="mb-2 text-lg text-gray-600">This quote is valid for 7 days</p>
                <p className="text-base text-gray-500">
                  To proceed with this quote or request a different option, please contact us
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-xl bg-gray-50 p-8">
            <h4 className="mb-6 text-2xl font-semibold text-gray-900">Contact Information</h4>
            <div className="space-y-8">
              <div>
                <label className="mb-4 block text-lg font-medium text-gray-700">
                  Contact Method
                </label>
                <div className="flex gap-8">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={method === 'email'}
                      onChange={() => {
                        setMethod('email');
                        setContact(customerEmail);
                      }}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-lg text-gray-700">Email</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={method === 'sms'}
                      onChange={() => {
                        setMethod('sms');
                        setContact(customerPhone);
                      }}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-lg text-gray-700">SMS</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-lg font-medium text-gray-700">
                  {method === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-4 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder={method === 'email' ? 'customer@example.com' : '+1 (555) 555-5555'}
                />
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button variant="outline" size="lg" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => onSend(method, contact)}
                  disabled={!contact}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Send Quote
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
