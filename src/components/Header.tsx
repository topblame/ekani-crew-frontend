'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

export default function Header() {
  const { isLoggedIn, user, logout, loading } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    setShowLogout(true);
  };

  const handleConfirmLogout = async () => {
    await logout();
    setShowLogout(false);
  };

  return (
    <>
    <header className="bg-white/70 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-pink-500">
            눈치코치
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/convert"
              className="px-4 py-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 text-sm font-medium transition"
            >
              메시지변환
            </Link>
            <Link
              href="/mbti-test"
              className="px-4 py-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 text-sm font-medium transition"
            >
              MBTI검사
            </Link>
            <Link
              href="/chat"
              className="px-4 py-2 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 text-sm font-medium transition"
            >
              채팅
            </Link>
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-400">로딩중...</div>
            ) : isLoggedIn ? (
              <>
                <Link
                  href="/mypage"
                  className="px-4 py-2 rounded-full border border-pink-300 text-black-600 text-sm font-medium transition hover:bg-pink-50"
                >
                  {user?.name || user?.email} 님
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium transition cursor-pointer"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium transition"
              >
                로그인
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
    <ConfirmModal
        open={showLogout}
        title="로그아웃"
        message="로그아웃 하시겠습니까?"
        confirmText="확인"
        cancelText="취소"
        onClose={() => setShowLogout(false)}
        onConfirm={handleConfirmLogout}
    />
    </>
  );
}