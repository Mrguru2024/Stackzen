'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import SavedQuotes, { SavedQuote } from '@/components/SavedQuotes';

interface Props {
  quotes: SavedQuote[];
  currentPage: number;
  totalPages: number;
  search: string;
  statusFilter: string;
}

const SavedQuotesClient = ({ quotes, currentPage, totalPages, search, statusFilter }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewQuote, setViewQuote] = useState<SavedQuote | null>(null);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
  };
  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('search', value);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const handleStatusFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', value);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };
  const handleView = (quote: SavedQuote) => setViewQuote(quote);
  const handleEdit = (quote: SavedQuote) =>
    router.push(`/app/(dashboard)/quotes/edit/${quote.id}`);
  const handleDelete = async (quote: SavedQuote) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <>
      <SavedQuotes
        quotes={quotes}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      {/* Simple modal for viewing quote details */}
      {viewQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-8 dark:bg-gray-900">
            <button
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
              onClick={() => setViewQuote(null)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="mb-4 text-xl font-bold">Quote Details</h2>
            <div className="space-y-2 text-sm">
              <div>
                <b>Quote #:</b> {viewQuote.number}
              </div>
              <div>
                <b>Date:</b> {new Date(viewQuote.createdAt).toLocaleDateString()}
              </div>
              <div>
                <b>Customer:</b> {viewQuote.customerName}
              </div>
              <div>
                <b>Service:</b> {viewQuote.serviceType}
              </div>
              <div>
                <b>Price:</b> ${viewQuote.price.toFixed(2)}
              </div>
              <div>
                <b>Status:</b> {viewQuote.status}
              </div>
              <div>
                <b>Tier:</b> {viewQuote.tier ?? 'N/A'}
              </div>
              <div>
                <b>Valid Until:</b>{' '}
                {viewQuote.validUntil ? new Date(viewQuote.validUntil).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SavedQuotesClient;
