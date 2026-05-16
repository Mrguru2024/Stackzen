'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { useBank, type BankTransaction } from '@/lib/hooks/use-bank';
import { usePlaidBankLink } from '@/lib/hooks/use-plaid-bank-link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Icons } from '@/components/ui/icons';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Separator } from '@/components/ui/separator'; // Uncomment if used

const categories = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Bills & Utilities',
  'Health & Fitness',
  'Travel',
  'Personal Care',
  'Education',
  'Gifts & Donations',
  'Business',
  'Other',
];

export default function BankImport() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc',
  });
  const pageSize = 10;

  const bank = useBank();
  const {
    transactions,
    isLoadingLinkToken,
    isLoadingTransactions,
    importTransactions,
    isImporting,
    filterTransactions,
    paginateTransactions,
  } = bank;

  const { open, ready, error: linkError } = usePlaidBankLink(
    {
      linkToken: bank.linkToken,
      isLoadingLinkToken: bank.isLoadingLinkToken,
      exchangeToken: bank.exchangeToken,
    },
    { onLinked: () => setIsOpen(true) }
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, amountRange, selectedCategories]);

  const handleImport = async () => {
    if (!transactions || selectedTransactions.length === 0) return;

    try {
      setError(null);
      const transactionsToImport = transactions
        .filter((t: BankTransaction) => selectedTransactions.includes(t.transaction_id))
        .map((t: BankTransaction) => ({
          ...t,
          category: selectedCategory ? [selectedCategory] : t.category,
        }));

      await importTransactions(transactionsToImport);
      setIsOpen(false);
      setSelectedTransactions([]);
      setSelectedCategory('');
    } catch (error) {
      console.error('Error importing transactions:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to import transactions');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === paginatedTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(paginatedTransactions.map((t: BankTransaction) => t.transaction_id));
    }
  };

  const filteredTransactions = transactions
    ? filterTransactions(transactions, {
        search: searchQuery,
        startDate: dateRange.start,
        endDate: dateRange.end,
        minAmount: amountRange.min ? Number(amountRange.min) : undefined,
        maxAmount: amountRange.max ? Number(amountRange.max) : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      })
    : [];

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortConfig.key === 'date') {
      return sortConfig.direction === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortConfig.key === 'amount') {
      return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    return 0;
  });

  const paginatedTransactions = paginateTransactions(sortedTransactions, {
    page: currentPage,
    pageSize,
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const totalAmount =
    selectedTransactions.length > 0
      ? paginatedTransactions
          .filter(t => selectedTransactions.includes(t.transaction_id))
          .reduce((sum, t) => sum + t.amount, 0)
      : 0;

  if (!session) {
    return (
      <Alert>
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          Please sign in to connect your bank account and import transactions.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Button onClick={() => open()} disabled={!ready || isLoadingLinkToken} className="w-full">
        {isLoadingLinkToken ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Icons.bank className="mr-2 h-4 w-4" />
            Connect Bank Account
          </>
        )}
      </Button>

      {(error || linkError) && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || linkError}</AlertDescription>
        </Alert>
      )}

      {isOpen && transactions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-lg border bg-background p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Import Transactions</h2>
                <p className="text-sm text-muted-foreground">
                  Select transactions to import as expenses
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
              >
                <Icons.x className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Icons.search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={amountRange.min}
                    onChange={e => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={amountRange.max}
                    onChange={e => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categories</Label>
                <Select
                  value={selectedCategories[0]}
                  onValueChange={value => setSelectedCategories([value])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedTransactions.length === paginatedTransactions.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedTransactions.length} of {paginatedTransactions.length} selected
                </span>
              </div>
              {selectedTransactions.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Amount: </span>
                  <span className="font-medium">{formatCurrency(totalAmount)}</span>
                </div>
              )}
            </div>

            {/* Transactions List */}
            <ScrollArea className="mb-6 h-[400px] rounded-md border">
              {isLoadingTransactions ? (
                <div className="flex h-full items-center justify-center">
                  <Icons.spinner className="h-8 w-8 animate-spin" />
                </div>
              ) : paginatedTransactions.length === 0 ? (
                <div className="flex h-full items-center justify-center p-8">
                  <Alert>
                    <AlertTitle>No transactions found</AlertTitle>
                    <AlertDescription>
                      Try adjusting your filters or search criteria.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="divide-y">
                  {paginatedTransactions.map(transaction => (
                    <div
                      key={transaction.transaction_id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          checked={selectedTransactions.includes(transaction.transaction_id)}
                          onCheckedChange={checked => {
                            setSelectedTransactions(prev =>
                              checked
                                ? [...prev, transaction.transaction_id]
                                : prev.filter(id => id !== transaction.transaction_id)
                            );
                          }}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{transaction.name}</p>
                            {transaction.pending && (
                              <Badge variant="secondary" className="text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{formatDate(new Date(transaction.date))}</span>
                            <span>•</span>
                            <span>{transaction.category.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mb-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <Icons.chevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <Icons.chevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Label>Default Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={handleImport}
                          disabled={selectedTransactions.length === 0 || isImporting}
                        >
                          {isImporting ? (
                            <>
                              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <Icons.import className="mr-2 h-4 w-4" />
                              Import Selected ({selectedTransactions.length})
                            </>
                          )}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Import selected transactions as expenses</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
