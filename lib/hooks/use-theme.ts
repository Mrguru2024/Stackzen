'use client';

import { useEffect, useState } from 'react';
import { useTheme as useProviderTheme } from '@/components/theme-provider';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const provider = useProviderTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateTheme = (newTheme: Theme) => {
    provider.setTheme(newTheme);
  };

  return {
    theme: provider.theme,
    setTheme: updateTheme,
    resolvedTheme: provider.resolvedTheme,
    mounted,
  };
}
