import toast from 'react-hot-toast';

export function showErrorToast(message: string) {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#FEE2E2',
      color: '#991B1B',
      border: '1px solid #FCA5A5',
    },
  });
}

export function showSuccessToast(message: string) {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#DCFCE7',
      color: '#166534',
      border: '1px solid #86EFAC',
    },
  });
}

export function showInfoToast(message: string) {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#EFF6FF',
      color: '#1E40AF',
      border: '1px solid #93C5FD',
    },
  });
}
