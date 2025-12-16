'use client';

import { useState, useEffect } from 'react';
import {
  checkAuthStatus,
  logout as apiLogout,
  getProfile,
  type AuthStatus,
  type UserProfile,
} from '@/lib/api';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // console.log("profile ==> ", profile);

  const router = useRouter();

  useEffect(() => {
    // 프로필 정보가 비어 있으면 프로필 페이지로 이동
    if (profile && (profile.mbti === null || profile.gender === null)) {
      router.push('/profile');
    }
  }, [profile, router]);

  useEffect(() => {
    loadAuthStatus();
  }, []);

  const loadAuthStatus = async () => {
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
  };

  const logout = async () => {
    try {
      await apiLogout();
      setAuthStatus({ logged_in: false });
      setProfile(null);
      // 로그아웃 후 홈으로 리다이렉트
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return {
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
}

