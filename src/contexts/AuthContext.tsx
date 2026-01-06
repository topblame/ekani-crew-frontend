'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  checkAuthStatus,
  logout as apiLogout,
  getProfile,
  type AuthStatus,
  type UserProfile,
} from '@/lib/api';

interface AuthContextValue {
  authStatus: AuthStatus | null;
  loading: boolean;
  isLoggedIn: boolean;
  user: { id?: string; email?: string; name?: string } | null;
  profile: UserProfile | null;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadAuthStatus = useCallback(async () => {
    try {
      const status = await checkAuthStatus();
      setAuthStatus(status);
      if (status.logged_in) {
        const p = await getProfile();
        setProfile(p);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      setAuthStatus({ logged_in: false });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthStatus();
  }, [loadAuthStatus]);

  const logout = async () => {
    try {
      await apiLogout();
      setAuthStatus({ logged_in: false });
      setProfile(null);
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const value: AuthContextValue = {
    authStatus,
    loading,
    isLoggedIn: authStatus?.logged_in ?? false,
    user: authStatus?.logged_in
      ? {
          id: authStatus.user_id,
          email: authStatus.email,
          name: authStatus.name,
        }
      : null,
    profile,
    logout,
    refresh: loadAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}