import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export function Loading({ text = 'Loading...', size = 'md' }: LoadingProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center">
      <Loader2
        data-testid="loading-spinner"
        className={`${sizeClasses[size]} animate-spin text-primary`}
      />
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

Loading.displayName = 'Loading';
export { Loading };
