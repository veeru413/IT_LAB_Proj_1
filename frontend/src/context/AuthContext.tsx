import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authService from '@/services/auth.service';
import { clearStoredToken, getStoredToken, setStoredToken, UNAUTHORIZED_EVENT } from '@/services/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  /** True until the stored token has been checked against the server. */
  isInitialising: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: authService.RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Owns the session: the JWT plus the profile it belongs to.
 *
 * The token lives in localStorage so a page refresh keeps the user signed in.
 * On boot the token is validated against `GET /api/auth/me` rather than
 * trusted blindly, so a revoked or expired token never yields a half-logged-in
 * UI. (Trade-off noted in ARCHITECTURE.md: localStorage is readable by XSS;
 * httpOnly cookies would be the hardened alternative.)
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);

  const clearSession = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  // Validate any previously stored token exactly once, on mount.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (!getStoredToken()) {
        setIsInitialising(false);
        return;
      }

      try {
        const currentUser = await authService.fetchCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsInitialising(false);
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // Any 401 from any request ends the session immediately.
  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const result = await authService.login({ email, password });
    setStoredToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload: authService.RegisterPayload): Promise<User> => {
    const result = await authService.register(payload);
    setStoredToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    clearSession();
  }, [clearSession]);

  const refresh = useCallback(async () => {
    try {
      setUser(await authService.fetchCurrentUser());
    } catch {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitialising,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
      refresh,
    }),
    [user, isInitialising, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
