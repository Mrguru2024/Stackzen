import React from 'react';
import { prisma } from '@/lib/prisma';

export type ServiceListingsProps = Record<string, never>;

export default async function ServiceListings({}: ServiceListingsProps) {
  // Fetch user's posted services from the database (placeholder, adjust model as needed)
  const user = await prisma.user.findFirst({ include: { services: true } });
  const services = user?.services ?? [];

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">My Service Listings</h1>
      <div className="mb-6 flex items-center justify-between">
        <span className="text-gray-700 dark:text-gray-300">Total Services: {services.length}</span>
        <button
          className="hover:bg-primary-dark rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          type="button"
          aria-label="Add new service"
        >
          Add New Service
        </button>
      </div>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-2 py-2 text-gray-600 dark:text-gray-300">Title</th>
              <th className="px-2 py-2 text-gray-600 dark:text-gray-300">Category</th>
              <th className="px-2 py-2 text-gray-600 dark:text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {services.length > 0 ? (
              services.map((s: any) => (
                <tr key={s.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-2 py-2 font-medium dark:text-white">{s.title}</td>
                  <td className="px-2 py-2">{s.category}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No services posted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
