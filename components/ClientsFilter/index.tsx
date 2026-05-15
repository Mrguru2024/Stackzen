import React from 'react';

interface ClientsFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const ClientsFilter: React.FC<ClientsFilterProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Filter:
      </label>
      <input
        id="filter"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-md border px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
        placeholder="Filter clients..."
      />
    </div>
  );
};

export default ClientsFilter;
