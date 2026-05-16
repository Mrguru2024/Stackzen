'use client';

import React from 'react';

export type FinancialReportsProps = Record<string, never>;

/** Placeholder until persisted financial reports are modeled in Prisma. */
export default function FinancialReports({}: FinancialReportsProps) {
  const reports: { id: string; name: string; date: string }[] = [];

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Financial Reports</h1>
      <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Report Summary</h2>
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Reports: {reports.length}
          </p>
        </div>
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Report Breakdown</h2>
        <div className="mb-4 h-64 overflow-y-auto rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          {reports.length > 0 ? (
            reports.map(report => (
              <div key={report.id} className="mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {report.name} - {report.date}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">No reports yet.</p>
          )}
        </div>
        <button
          type="button"
          className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Generate Report
        </button>
        <div className="mt-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <strong>Disclaimer:</strong> The information provided in these reports is for
            informational purposes only and does not constitute financial advice. Always consult
            with a qualified financial advisor for personalized guidance.
          </p>
        </div>
      </div>
    </div>
  );
}
