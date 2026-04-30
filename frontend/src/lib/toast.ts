import { toast as toastify, ToastOptions } from 'react-toastify';

interface AppToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
}

const baseOptions: ToastOptions = {
  style: {
    borderRadius: '12px',
    backdropFilter: 'blur(12px)',
    fontWeight: 500,
    fontSize: '14px',
    boxShadow: '0 20px 60px -10px rgba(0,0,0,0.4)',
  },
};

export const toast = ({ title, description, variant, duration }: AppToastOptions) => {
  const message = description ? `${title}\n${description}` : title;
  const opts: ToastOptions = { ...baseOptions, autoClose: duration ?? 3500 };

  if (variant === 'destructive') {
    toastify.error(message, opts);
  } else if (variant === 'warning') {
    toastify.warning(message, opts);
  } else if (variant === 'info') {
    toastify.info(message, opts);
  } else {
    toastify.success(message, opts);
  }
};

export const showToast = {
  success: (message: string, description?: string) =>
    toastify.success(description ? `${message}\n${description}` : message, baseOptions),
  error: (message: string, description?: string) =>
    toastify.error(description ? `${message}\n${description}` : message, baseOptions),
  info: (message: string, description?: string) =>
    toastify.info(description ? `${message}\n${description}` : message, baseOptions),
  warning: (message: string, description?: string) =>
    toastify.warning(description ? `${message}\n${description}` : message, baseOptions),
};
