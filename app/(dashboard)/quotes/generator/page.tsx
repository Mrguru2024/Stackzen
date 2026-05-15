'use client';
import React from 'react';
import QuoteGenerator from '@/components/QuoteGenerator';
import Link from 'next/link';

const FullQuoteGeneratorPage = () => {
  const handleSave = (quote: any) => {
    // Optionally, redirect or show a toast
    console.log('Quote saved:', quote);
  };
  const handleCancel = () => {
    // Optionally, redirect or show a toast
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 px-2 py-8 dark:bg-gray-950 md:px-8">
      <div className="mx-auto max-w-7xl bg-transparent">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Full Quote Generator</h1>
          <Link href="/quotes">
            <span className="text-blue-600 hover:underline">Back to Quotes</span>
          </Link>
        </div>
        <QuoteGenerator onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default FullQuoteGeneratorPage;
