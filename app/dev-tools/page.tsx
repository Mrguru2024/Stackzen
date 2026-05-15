'use client';

import React from 'react';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { SuperAdminDiagnostics } from '@/components/admin/SuperAdminDiagnostics';

const VIEW_AS_OPTIONS = [
  { label: 'Default (Real)', value: 'REAL' },
  { label: 'Trial', value: 'TRIAL' },
  { label: 'PRO', value: 'PRO' },
  { label: 'Mentor', value: 'MENTOR' },
];

export default function DevToolsPage() {
  const { data: session } = useSession();
  const [viewAs, setViewAs] = useState('REAL');

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      const saved = localStorage.getItem('superadmin_viewas');
      if (saved) setViewAs(saved);
    }
  }, [session]);

  const handleViewAsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewAs(e.target.value);
    localStorage.setItem('superadmin_viewas', e.target.value);
    window.location.reload(); // Force reload to apply new view
  };

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return <div className="p-8 text-red-500">Access denied.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Super Admin Dev Tools</h1>
      <div className="mb-6">
        <label htmlFor="view-as-select" className="mr-2 font-semibold">
          View As:
        </label>
        <select
          id="view-as-select"
          value={viewAs}
          onChange={handleViewAsChange}
          className="rounded border px-2 py-1"
        >
          {VIEW_AS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="ml-4 text-xs text-gray-500">Affects only your UI for testing.</span>
      </div>
      <SuperAdminDiagnostics isSuperAdmin={true} />
    </div>
  );
}
