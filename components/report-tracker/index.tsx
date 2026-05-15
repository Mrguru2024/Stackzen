import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

interface Report {
  id: string;
  name: string;
  date: string;
  userId: string;
}

export default function ReportTracker() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const {
    data: reports,
    isLoading,
    error,
  } = useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
  });

  const createReport = useMutation({
    mutationFn: async (newReport: Omit<Report, 'id'>) => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      });
      if (!res.ok) throw new Error('Failed to create report');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setName('');
      setDate('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReport.mutate({
      name,
      date,
      userId: 'user-id', // Replace with actual user ID from auth
    });
  };

  if (isLoading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">Error loading reports</div>;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">Report Tracker</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            required
          />
        </div>
        <button
          type="submit"
          className="hover:bg-primary-dark w-full rounded bg-primary px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Add Report
        </button>
      </form>
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h2 className="mb-4 text-lg font-semibold dark:text-white">Reports List</h2>
        {reports?.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No reports yet.</p>
        ) : (
          <ul>
            {reports?.map(report => (
              <li key={report.id} className="mb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {report.name} - {new Date(report.date).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
