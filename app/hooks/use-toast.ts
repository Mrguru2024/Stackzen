'use client';

import { toast as sonnerToast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function useToast() {
  const toast = ({ title, description, action }: ToastProps) => {
    return sonnerToast(title, {
      description,
      action: action && {
        label: action.label,
        onClick: action.onClick,
      },
    });
  };

  return {
    toast,
    success: (props: ToastProps) => toast({ ...props, title: props.title || 'Success' }),
    error: (props: ToastProps) => toast({ ...props, title: props.title || 'Error' }),
    warning: (props: ToastProps) => toast({ ...props, title: props.title || 'Warning' }),
    info: (props: ToastProps) => toast({ ...props, title: props.title || 'Info' }),
  };
}
