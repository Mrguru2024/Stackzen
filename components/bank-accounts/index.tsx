import React from 'react';
import { prisma } from '@/lib/prisma';

export type BankAccountsProps = Record<string, never>;

export default async function BankAccounts({}: BankAccountsProps) {
  // Fetch bank accounts from the database (placeholder, adjust model as needed)
  const accounts = await prisma.bankAccount.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Bank Accounts</h1>
      <div className="mb-6 flex items-center justify-between">
        <span className="text-gray-700 dark:text-gray-300">
          Connected Accounts: {accounts.length}
        </span>
        <button
          className="hover:bg-primary-dark rounded bg-primary px-4 py-2 text-white transition-colors"
          aria-label="Add Bank Account"
        >
          + Add Bank Account
        </button>
      </div>
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Bank</th>
              <th className="px-4 py-2 text-left">Account Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-4 py-2">{account.bankName}</td>
                <td className="px-4 py-2">{account.accountName}</td>
                <td className="px-4 py-2">{account.type}</td>
                <td className="px-4 py-2">{account.status}</td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No bank accounts connected yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
