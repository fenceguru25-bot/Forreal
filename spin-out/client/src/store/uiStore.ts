import { create } from 'zustand';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UiState {
  showAuthModal: boolean;
  authModalTab: 'login' | 'register';
  toasts: ToastItem[];
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  showAuthModal: false,
  authModalTab: 'login',
  toasts: [],
  openAuthModal: (tab = 'login') => set({ showAuthModal: true, authModalTab: tab }),
  closeAuthModal: () => set({ showAuthModal: false }),
  addToast: (toast) => set((state) => ({ toasts: [...state.toasts, { id: crypto.randomUUID(), ...toast }] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
}));
