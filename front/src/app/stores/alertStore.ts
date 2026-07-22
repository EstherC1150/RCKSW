import { create } from 'zustand';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: AlertType;
}

interface ToastItem {
  id: string;
  message: string;
  type: AlertType;
}

interface AlertState {
  // Modal State
  isOpen: boolean;
  mode: 'alert' | 'confirm';
  type: AlertType;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  resolveFn: ((value: boolean) => void) | null;

  // Toast State
  toasts: ToastItem[];

  // Actions
  showAlert: (message: string, options?: AlertOptions) => Promise<boolean>;
  showConfirm: (message: string, options?: AlertOptions) => Promise<boolean>;
  closeModal: (result: boolean) => void;
  showToast: (message: string, type?: AlertType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  isOpen: false,
  mode: 'alert',
  type: 'info',
  title: '',
  message: '',
  confirmText: '확인',
  cancelText: '취소',
  resolveFn: null,

  toasts: [],

  showAlert: (message, options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        mode: 'alert',
        type: options?.type || 'info',
        title: options?.title || '알림',
        message,
        confirmText: options?.confirmText || '확인',
        cancelText: '취소',
        resolveFn: resolve,
      });
    });
  },

  showConfirm: (message, options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        mode: 'confirm',
        type: options?.type || 'warning',
        title: options?.title || '확인',
        message,
        confirmText: options?.confirmText || '확인',
        cancelText: options?.cancelText || '취소',
        resolveFn: resolve,
      });
    });
  },

  closeModal: (result) => {
    const { resolveFn } = get();
    if (resolveFn) {
      resolveFn(result);
    }
    set({ isOpen: false, resolveFn: null });
  },

  showToast: (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
