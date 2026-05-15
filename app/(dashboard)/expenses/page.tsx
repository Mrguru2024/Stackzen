'use client';

import React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/ui/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpenseDialog } from '@/components/expenses/expense-dialog';
import BankImport from '@/components/bank-import';
import { useExpenses } from '@/lib/hooks/use-expenses';

const categories = [
  'Food',
  'Transportation',
  'Entertainment',
  'Housing',
  'Utilities',
  'Healthcare',
  'Shopping',
  'Other',
];

function isInCurrentCalendarMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { expenses, isLoading, error, deleteExpense } = useExpenses();

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const thisMonthTotal = expenses
    .filter(e => isInCurrentCalendarMonth(e.date))
    .reduce((sum, exp) => sum + exp.amount, 0);
  const allTimeTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleDeleteExpense = (id: string) => {
    deleteExpense(id);
  };

  if (isLoading) {
    return (
      <div className="w-full flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-center">
          <p className="text-red-500">Error loading expenses: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between pb-8 pt-6">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <BankImport />
          <ExpenseDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${thisMonthTotal.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">This month (calendar)</p>
                {expenses.length > 0 && thisMonthTotal !== allTimeTotal && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    All time: ${allTimeTotal.toFixed(2)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expense List</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                    {expenses.length === 0 ? (
                      <span>
                        No expenses recorded yet. Use <strong>Add Expense</strong> to enter one
                        manually, or <strong>Connect Bank Account</strong> to import transactions
                        after linking Plaid.
                      </span>
                    ) : (
                      <span>No expenses match your search or category filters.</span>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <ExpenseDialog expense={expense} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Icons.trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
