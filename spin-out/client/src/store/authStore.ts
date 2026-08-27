import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../../shared/src/types';
import { api } from '../lib/api';

interface AuthState {
  user: (User & { avatarUrl?: string | null; selfExcluded?: boolean }) | null;
  token: string | null;
  refreshTokenValue: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: { username: string; email: string; password: string; state: string }) => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (user: Partial<User> & Record<string, unknown>) => void;
  setLoading: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(persist((set, get) => ({
  user: null,
  token: null,
  refreshTokenValue: null,
  isAuthenticated: false,
  isLoading: false,
  setLoading: (value) => set({ isLoading: value }),
  login: async ({ email, password }) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token, refreshToken } = response.data.data;
      set({ user, token, refreshTokenValue: refreshToken, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  logout: async () => {
    const { user, refreshTokenValue } = get();
    if (user && refreshTokenValue) {
      try {
        await api.post('/auth/logout', { userId: user.id, refreshToken: refreshTokenValue });
      } catch {}
    }
    set({ user: null, token: null, refreshTokenValue: null, isAuthenticated: false, isLoading: false });
  },
  register: async ({ username, email, password, state }) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/register', { username, email, password, state });
      const { user, token } = response.data.data;
      set({ user, token, refreshTokenValue: null, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  refreshToken: async () => {
    const { user, refreshTokenValue } = get();
    if (!user || !refreshTokenValue) return;
    const response = await api.post('/auth/refresh', { userId: user.id, refreshToken: refreshTokenValue });
    set({ token: response.data.data.token, isAuthenticated: true });
  },
  updateUser: (payload) => set((state) => ({ user: state.user ? { ...state.user, ...payload } : null }))
}), { name: 'spin-out-auth' }));
