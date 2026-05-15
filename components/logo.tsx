'use client';

import React from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { _cn } from '@/lib/utils';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '64' | '256';
}

export function Logo({ className, size = 'md', ...props }: LogoProps) {
  const _sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-[500px] w-[500px]',
    '64': 'h-16 w-auto',
    '256': 'h-64 w-auto',
  };

  return (
    <div className={_cn('relative', _sizeClasses[size], className)} {...props}>
      <Link href="/" className="block h-full w-full">
        <Image
          src="/Full size.svg"
          alt="StackZen Logo"
          width={152}
          height={34}
          className="h-full w-full object-contain"
        />
      </Link>
    </div>
  );
}
