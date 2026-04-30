import { toast as toastify } from 'react-toastify';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const toast = ({ title, description, variant }: ToastOptions) => {
  const message = description ? `${title}: ${description}` : title;
  
  if (variant === 'destructive') {
    toastify.error(message);
  } else {
    toastify.success(message);
  }
};

export const showToast = {
  success: (message: string) => toastify.success(message),
  error: (message: string) => toastify.error(message),
  info: (message: string) => toastify.info(message),
  warning: (message: string) => toastify.warning(message),
};
