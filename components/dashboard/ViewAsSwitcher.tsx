import { useViewAsStore } from '@/store/viewAsStore';
import React from 'react';

const roles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Super Admin', value: 'super_admin' },
  { label: 'Pro User', value: 'pro' },
  { label: 'Trial User', value: 'trial' },
];

export function ViewAsSwitcher({ realRole }: { realRole: string }) {
  const { viewAs, setViewAs } = useViewAsStore();
  if (realRole !== 'admin' && realRole !== 'super_admin') return null;

  return (
    <select
      className="ml-4 rounded border px-2 py-1"
      value={viewAs || realRole}
      onChange={e => setViewAs(e.target.value as any)}
    >
      {roles.map(r => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
}
