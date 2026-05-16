import { toast as sonnerToast } from 'sonner';

type ToastVariant = 'default' | 'destructive' | 'success' | 'info' | 'warning';

type ToastProps = {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Maps shadcn-style variants to Sonner toast types. */
  variant?: ToastVariant;
};

function sonnerOptions(description?: string, action?: ToastProps['action']) {
  return {
    description,
    action:
      action &&
      ({
        label: action.label,
        onClick: action.onClick,
      } as const),
  };
}

export function useToast() {
  const _toast = ({ title, description, action, variant }: ToastProps) => {
    const opts = sonnerOptions(description, action);
    const message = title ?? '';

    switch (variant) {
      case 'destructive':
        return sonnerToast.error(message, opts);
      case 'success':
        return sonnerToast.success(message, opts);
      case 'info':
        return sonnerToast.info(message, opts);
      case 'warning':
        return sonnerToast.warning(message, opts);
      default:
        return sonnerToast(message, opts);
    }
  };

  return {
    toast: _toast,
    success: (props: ToastProps) => _toast({ ...props, title: props.title || 'Success' }),
    error: (props: ToastProps) => _toast({ ...props, title: props.title || 'Error', variant: 'destructive' }),
    warning: (props: ToastProps) => _toast({ ...props, title: props.title || 'Warning', variant: 'warning' }),
    info: (props: ToastProps) => _toast({ ...props, title: props.title || 'Info', variant: 'info' }),
  };
}
