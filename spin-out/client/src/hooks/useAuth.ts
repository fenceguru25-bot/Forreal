import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshTokenValue = useAuthStore((state) => state.refreshTokenValue);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!isAuthenticated || !refreshTokenValue) return;
    const interval = window.setInterval(() => {
      refreshToken().catch(() => logout());
    }, 10 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, refreshTokenValue, refreshToken, logout]);

  return useAuthStore();
};
