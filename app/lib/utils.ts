import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Toast error handler utility
export function showErrorToast(message: string) {
  // Dynamically import the toast system to avoid SSR issues
  import('@/app/components/ui/toast').then(({ toast }) => {
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  });
}

export function showSuccessToast(message: string) {
  import('@/app/components/ui/toast').then(({ toast }) => {
    toast({
      title: 'Success',
      description: message,
      variant: 'success',
    });
  });
}

export function showInfoToast(message: string) {
  import('@/app/components/ui/toast').then(({ toast }) => {
    toast({
      title: 'Info',
      description: message,
      variant: 'info',
    });
  });
}
