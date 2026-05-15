import React from 'react';

const mockCategories = [
  { name: 'Groceries', cap: 300 },
  { name: 'Dining', cap: 150 },
  { name: 'Transport', cap: 100 },
];

export default function BudgetCategorySetup() {
  // const [categories, setCategories] = useState(mockCategories);

  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-zinc-900">
      <h2 className="mb-2 text-lg font-bold">Zen Budget Saver</h2>
      <p className="mb-2">Set category caps and auto-save surplus.</p>
      <ul className="mb-2">
        {mockCategories.map((cat, i) => (
          <li key={i} className="flex justify-between">
            <span>{cat.name}</span>
            <span>${cat.cap}</span>
          </li>
        ))}
      </ul>
      <button className="mt-3 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Edit Categories
      </button>
    </div>
  );
}
