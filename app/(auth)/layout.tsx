'use client';
import React from 'react';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex min-h-dvh w-full min-w-0 max-w-[100vw] flex-col items-center justify-center overflow-x-hidden px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] pt-[max(1.5rem,env(safe-area-inset-top,0px))] sm:px-6',
        'bg-gradient-to-br',
        'from-emerald-100',
        'via-emerald-50',
        'to-emerald-200',
        'dark:from-gray-900',
        'dark:via-gray-800',
        'dark:to-gray-900'
      )}
    >
      {children}
    </motion.div>
  );
}
