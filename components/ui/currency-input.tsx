'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  currency?: string;
}

export const CurrencyInput = ({ name, onChange, ...props }) => (
  <input type="text" name={name} onChange={onChange} {...props} />
);
