'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { requestMatch, cancelMatch, MatchRequestResponse } from '@/lib/api';

type MatchingStatus = 'idle' | 'waiting' | 'matched' | 'error';

export default function MatchingClient() {
  const router = useRouter();
  const { isLoggedIn, user, profile, loading } = useAuth();

  const [status, setStatus] = useState<MatchingStatus>('idle');
  const [waitCount, setWaitCount] = useState(0);
  const [matchedMbti, setMatchedMbti] = useState<string | null>(null);
  const [matchedRoomId, setMatchedRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 로그인 체크
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, router]);

  // MBTI 체크
  useEffect(() => {
    if (!loading && isLoggedIn && !profile?.mbti) {
      router.push('/profile');
    }
  }, [loading, isLoggedIn, profile, router]);

  const handleStartMatching = async () => {
    if (!user?.id || !profile?.mbti) return;

    setIsLoading(true);
    setError(null);

    try {
      const response: MatchRequestResponse = await requestMatch({
        user_id: user.id,
        mbti: profile.mbti,
      });

      if (response.status === 'matched' || response.status === 'already_matched') {
        // 즉시 매칭 성공 또는 이미 매칭됨
        setStatus('matched');
        setMatchedMbti(response.partner?.mbti || '???');
        setMatchedRoomId(response.roomId || null);
      } else if (response.status === 'already_chatting') {
        // 이미 채팅 중 - 바로 채팅방으로 이동
        if (response.roomId) {
          router.push(`/chat/${response.roomId}`);
        }
      } else {
        // waiting 또는 already_waiting
        setStatus('waiting');
        setWaitCount(response.wait_count || 0);
      }

    } catch (err) {
      console.error('매칭 요청 실패:', err);
      setError('매칭 요청에 실패했습니다. 다시 시도해주세요.');
      setStatus('error');

      // 에러 발생 시 대기열에 등록되었을 수 있으므로 정리
      try {
        await cancelMatch({ user_id: user.id, mbti: profile.mbti });
      } catch {
        // 취소 실패는 무시 (애초에 대기열에 없었을 수도 있음)
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelMatching = async () => {
    if (!user?.id || !profile?.mbti) return;

    setIsLoading(true);

    try {
      await cancelMatch({
        user_id: user.id,
        mbti: profile.mbti,
      });

      setStatus('idle');
      setWaitCount(0);
    } catch (err) {
      console.error('매칭 취소 실패:', err);
      setError('매칭 취소에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToChat = () => {
    if (matchedRoomId) {
      router.push(`/chat/${matchedRoomId}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-lg p-8">
          {/* 타이틀 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">MBTI 매칭</h1>
            <p className="text-gray-500">
              나와 맞는 사람을 찾아보세요
            </p>
            {profile?.mbti && (
              <p className="mt-2 text-purple-600 font-medium">
                내 MBTI: {profile.mbti}
              </p>
            )}
          </div>

          {/* 상태별 UI */}
          {status === 'idle' && (
            <div className="text-center">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">💕</span>
                </div>
                <p className="text-gray-600">
                  매칭을 시작하면 같은 MBTI를 가진 사람들과<br />
                  무작위로 매칭됩니다.
                </p>
              </div>
              <button
                onClick={handleStartMatching}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-medium text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '매칭 시작하기'}
              </button>
            </div>
          )}

          {status === 'waiting' && (
            <div className="text-center">
              <div className="mb-8">
                {/* 로딩 애니메이션 */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl">🔍</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">매칭 중...</h2>
                <p className="text-gray-500 mb-4">
                  나와 맞는 사람을 찾고 있어요
                </p>
                <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm">
                  대기 중인 인원: {waitCount}명
                </div>
              </div>
              <button
                onClick={handleCancelMatching}
                disabled={isLoading}
                className="w-full py-4 bg-gray-200 text-gray-700 rounded-full font-medium text-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리 중...' : '매칭 취소'}
              </button>
            </div>
          )}

          {status === 'matched' && (
            <div className="text-center">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">매칭 성공!</h2>
                <p className="text-gray-600 mb-4">
                  상대방의 MBTI
                </p>
                <div className="inline-block bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-3 rounded-full text-2xl font-bold">
                  {matchedMbti}
                </div>
              </div>
              <button
                onClick={handleGoToChat}
                className="w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-medium text-lg hover:opacity-90 transition"
              >
                채팅 시작하기
              </button>
              <button
                onClick={() => setStatus('idle')}
                className="w-full py-4 mt-3 bg-gray-200 text-gray-700 rounded-full font-medium text-lg hover:bg-gray-300 transition"
              >
                다시 매칭하기
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mb-8">
                <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">😢</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
                <p className="text-red-500">{error}</p>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-medium text-lg hover:opacity-90 transition"
              >
                다시 시도하기
              </button>
            </div>
          )}
        </div>

      {/* 안내 문구 */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>무료 사용자는 하루 3회까지 매칭할 수 있습니다.</p>
      </div>
    </div>
  );
}
