import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface InvoicePreviewProps {
  data: {
    invoiceNumber: string;
    dueDate: Date;
    clientName: string;
    clientEmail: string | null;
    lineItems: LineItem[];
    total: string | number;
    notes?: string;
    terms?: string;
  };
  companyInfo?: {
    name: string;
    email: string;
    logo?: string;
  };
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  data,
  companyInfo = { name: 'Your Company', email: 'company@example.com' },
}) => {
  return (
    <Card className="w-full bg-white shadow-lg dark:bg-gray-800">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b border-gray-200 pb-6 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {companyInfo.logo ? (
              <Image
                src={companyInfo.logo}
                alt="Company Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                <span className="text-2xl font-bold text-gray-400">{companyInfo.name[0]}</span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {companyInfo.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{companyInfo.email}</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              INVOICE #{data.invoiceNumber}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Due Date: {format(data.dueDate, 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-8">
          <h4 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">BILLED TO</h4>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {data.clientName}
          </p>
          {data.clientEmail && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{data.clientEmail}</p>
          )}
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </th>
                <th className="py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Quantity
                </th>
                <th className="py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Unit Price
                </th>
                <th className="py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.lineItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                    {item.description}
                  </td>
                  <td className="py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                    {item.quantity}
                  </td>
                  <td className="py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                    ${item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={3}
                  className="py-4 text-right font-semibold text-gray-900 dark:text-gray-100"
                >
                  Total:
                </td>
                <td className="py-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                  $
                  {typeof data.total === 'string'
                    ? parseFloat(data.total).toFixed(2)
                    : data.total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terms and Notes */}
        {(data.terms || data.notes) && (
          <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-700">
            {data.terms && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Terms</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{data.terms}</p>
              </div>
            )}
            {data.notes && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">{data.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoicePreview;
