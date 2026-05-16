'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void;
  currency?: string;
}

export const CurrencyInput = ({
  name,
  onChange,
  currency,
  className,
  ...props
}: CurrencyInputProps) => (
  <Input
    type="text"
    name={name}
    className={cn(className)}
    aria-label={currency ? `Amount in ${currency}` : undefined}
    onChange={e => onChange?.(e.target.value)}
    {...props}
  />
);
