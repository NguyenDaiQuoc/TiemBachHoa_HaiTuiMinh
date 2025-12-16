import toast from 'react-hot-toast';

// Z-index cao nhất để hiển thị trên tất cả modal và overlay
const TOAST_Z_INDEX = 99999;

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      background: '#10b981',
      color: '#fff',
      fontWeight: '500',
      zIndex: TOAST_Z_INDEX,
    },
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
    style: {
      background: '#ef4444',
      color: '#fff',
      fontWeight: '500',
      zIndex: TOAST_Z_INDEX,
    },
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-center',
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontWeight: '500',
      zIndex: TOAST_Z_INDEX,
    },
  });
};
