import React from 'react';

export interface SavedQuote {
  id: string;
  createdAt: string;
  customerName: string;
  serviceType: string;
  price: number;
  status: string;
  number?: string;
  validUntil?: string;
  tier?: string;
}

export interface SavedQuotesProps {
  quotes: SavedQuote[];
  onView?: (quote: SavedQuote) => void;
  onEdit?: (quote: SavedQuote) => void;
  onDelete?: (quote: SavedQuote) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

const SavedQuotes: React.FC<SavedQuotesProps> = ({
  quotes,
  onView,
  onEdit,
  onDelete,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  search = '',
  onSearchChange,
  statusFilter = '',
  onStatusFilterChange,
}) => {
  return (
    <div className="w-full">
      {/* Search and Filter Controls */}
      <div className="mb-4 flex flex-col items-center gap-4 sm:flex-row">
        <input
          type="text"
          placeholder="Search by customer, service, or quote #..."
          value={search}
          onChange={e => onSearchChange?.(e.target.value)}
          className="w-full rounded border p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 sm:w-64"
        />
        <select
          value={statusFilter}
          onChange={e => onStatusFilterChange?.(e.target.value)}
          className="w-full rounded border p-2 text-sm sm:w-48"
          title="Filter by status"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Quotes Table */}
      <div className="w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Service
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No saved quotes found.
                </td>
              </tr>
            ) : (
              quotes.map(quote => (
                <tr key={quote.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {quote.customerName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {quote.serviceType}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-gray-100">
                    {typeof quote.price === 'number' ? `$${quote.price.toFixed(2)}` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${quote.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : quote.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : quote.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : quote.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="flex gap-2 whitespace-nowrap px-4 py-3 text-sm">
                    <button
                      className="text-blue-600 hover:underline dark:text-blue-400"
                      onClick={() => onView?.(quote)}
                    >
                      View
                    </button>
                    <button
                      className="text-green-600 hover:underline dark:text-green-400"
                      onClick={() => onEdit?.(quote)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline dark:text-red-400"
                      onClick={() => onDelete?.(quote)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            className="rounded border bg-gray-100 px-3 py-1 text-gray-700 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-200">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="rounded border bg-gray-100 px-3 py-1 text-gray-700 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-200"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SavedQuotes;
