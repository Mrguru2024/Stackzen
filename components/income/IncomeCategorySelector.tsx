'use client';

import React from 'react';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const categories = [
  {
    value: 'all',
    label: 'All Categories',
  },
  {
    value: 'salary',
    label: 'Salary',
  },
  {
    value: 'freelance',
    label: 'Freelance',
  },
  {
    value: 'investments',
    label: 'Investments',
  },
  {
    value: 'business',
    label: 'Business',
  },
  {
    value: 'rental',
    label: 'Rental Income',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

interface IncomeCategorySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function IncomeCategorySelector({
  value = 'all',
  onValueChange,
}: IncomeCategorySelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? categories.find(category => category.value === value)?.label
            : 'Select category...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandEmpty>No category found.</CommandEmpty>
          <CommandGroup>
            {categories.map(category => (
              <CommandItem
                key={category.value}
                value={category.value}
                onSelect={currentValue => {
                  onValueChange?.(currentValue === value ? 'all' : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === category.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {category.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
