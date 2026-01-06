'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const router = useRouter();
  const auth = useAuthContext();

  useEffect(() => {
    // 프로필 정보가 비어 있으면 프로필 페이지로 이동
    // 단, 이미 /profile 페이지에 있는 경우는 제외
    const currentPath = window.location.pathname;
    if (auth.profile && (auth.profile.mbti === null || auth.profile.gender === null) && currentPath !== '/profile') {
      router.push('/profile');
    }
  }, [auth.profile, router]);

  return auth;
}

