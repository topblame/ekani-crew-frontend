'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  requestMatch,
  cancelMatch,
  getMyChatRooms,
  getMatchWebSocketUrl,
  MatchRequestResponse,
  MatchNotification,
  ChatRoomPreview,
} from '@/lib/api';

type MatchingStatus = 'idle' | 'waiting' | 'matched';

interface ChatRoom {
  id: string;
  partnerId: string;
  partnerMbti: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// 시간 포맷팅 헬퍼
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function ChatListClient() {
  const router = useRouter();
  const { isLoggedIn, user, profile, loading } = useAuth();

  // Matching state
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus>('idle');
  const [matchingMessage, setMatchingMessage] = useState<string>('매칭 중...');
  const [waitCount, setWaitCount] = useState(0);
  const [matchedMbti, setMatchedMbti] = useState<string | null>(null);
  const [matchedRoomId, setMatchedRoomId] = useState<string | null>(null);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // Chat list state
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  // refs
  const previousRoomCountRef = useRef<number>(0);
  const matchingStatusRef = useRef<MatchingStatus>('idle');
  const matchWsRef = useRef<WebSocket | null>(null);

  // matchingStatus 변경 시 ref도 업데이트
  useEffect(() => {
    matchingStatusRef.current = matchingStatus;
  }, [matchingStatus]);

  // 페이지 이탈 시 매칭 취소 및 WebSocket 해제 (cleanup)
  useEffect(() => {
    return () => {
      // WebSocket 연결 해제
      if (matchWsRef.current) {
        matchWsRef.current.close();
        matchWsRef.current = null;
      }
      // 매칭 대기 중일 때만 취소
      if (matchingStatusRef.current === 'waiting' && user?.id && profile?.mbti) {
        cancelMatch({ user_id: user.id, mbti: profile.mbti }).catch(() => {
          // 취소 실패는 무시
        });
      }
    };
  }, [user?.id, profile?.mbti]);

  // 로그인 체크
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, router]);

  // ChatRoomPreview를 ChatRoom으로 변환
  const convertToRoom = useCallback((room: ChatRoomPreview, userId: string): ChatRoom => {
    const partnerId = room.user1_id === userId ? room.user2_id : room.user1_id;
    return {
      id: room.id,
      partnerId,
      partnerMbti: null, // 백엔드에서 제공 안함 - 추후 연동 필요
      lastMessage: room.latest_message?.content || '새로운 채팅방입니다',
      lastMessageTime: room.latest_message
        ? formatTime(room.latest_message.created_at)
        : formatTime(room.created_at),
      unreadCount: room.unread_count,
    };
  }, []);

  // 채팅방 목록 로드
  const loadChatRooms = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;

    try {
      const response = await getMyChatRooms(userId);
      const rooms = response.rooms.map((room) => convertToRoom(room, userId));
      setChatRooms(rooms);
      previousRoomCountRef.current = rooms.length;
    } catch (err) {
      console.error('채팅방 목록 로드 실패:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [user?.id, convertToRoom]);

  // 초기 채팅방 목록 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      void loadChatRooms();
    }
  }, [isLoggedIn, user?.id, loadChatRooms]);

  // 매칭 레벨별 시나리오 (순환)
  const MATCHING_LEVELS = [
    { level: 1, message: '천생연분을 찾는 중...' },
    { level: 2, message: '잘 맞는 상대를 찾는 중...' },
    { level: 3, message: '새로운 인연을 찾는 중...' },
    { level: 4, message: '인연을 찾는 중...' },
  ];

  // 매칭 폴링 간격 (초)
  const MATCHING_INTERVAL = 3;

  // sleep 함수
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // WebSocket으로 매칭 알림 수신 처리
  const handleMatchNotification = useCallback((notification: MatchNotification) => {
    console.log('[매칭] WebSocket 알림 수신:', notification);

    if (notification.status === 'matched') {
      setMatchingStatus('matched');
      setMatchedRoomId(notification.roomId);
      setMatchedMbti(notification.partner.mbti);
      void loadChatRooms();

      // WebSocket 연결 해제
      if (matchWsRef.current) {
        matchWsRef.current.close();
        matchWsRef.current = null;
      }
    }
  }, [loadChatRooms]);

  // WebSocket 연결 설정
  const connectMatchWebSocket = useCallback((userId: string) => {
    // 기존 연결이 있으면 해제
    if (matchWsRef.current) {
      matchWsRef.current.close();
    }

    const wsUrl = getMatchWebSocketUrl(userId);
    console.log('[매칭] WebSocket 연결 시도:', wsUrl);

    const ws = new WebSocket(wsUrl);
    matchWsRef.current = ws;

    ws.onopen = () => {
      console.log('[매칭] WebSocket 연결됨');
    };

    ws.onmessage = (event) => {
      try {
        const data: MatchNotification = JSON.parse(event.data);
        handleMatchNotification(data);
      } catch (err) {
        console.error('[매칭] WebSocket 메시지 파싱 실패:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('[매칭] WebSocket 에러:', error);
    };

    ws.onclose = () => {
      console.log('[매칭] WebSocket 연결 종료');
    };
  }, [handleMatchNotification]);

  const handleStartMatching = async () => {
    console.log('[매칭] 시작 - user:', user, 'profile:', profile);

    if (!user?.id || !profile?.mbti) {
      console.log('[매칭] early return - user.id:', user?.id, 'profile.mbti:', profile?.mbti);
      return;
    }

    setIsMatchingLoading(true);
    setMatchingError(null);
    setMatchingStatus('waiting');
    matchingStatusRef.current = 'waiting';

    // WebSocket 연결 (매칭 알림 수신용)
    connectMatchWebSocket(user.id);

    let levelIndex = 0;

    try {
      // 루프 시작 전 로딩 해제 (취소 버튼 활성화)
      setIsMatchingLoading(false);

      // 유저가 취소할 때까지 계속 매칭 시도
      while (matchingStatusRef.current === 'waiting') {
        const currentLevel = MATCHING_LEVELS[levelIndex];
        console.log('[매칭] level:', currentLevel.level);

        // UI 업데이트
        setMatchingMessage(currentLevel.message);

        // 서버에 매칭 요청
        const response: MatchRequestResponse = await requestMatch({
          user_id: user.id,
          mbti: profile.mbti,
          level: currentLevel.level,
        });

        // 대기 인원 업데이트
        setWaitCount(response.wait_count || 0);

        // 매칭 성공! (HTTP 응답으로 받은 경우 - 내가 상대를 찾은 경우)
        if (response.status === 'matched' || response.status === 'already_matched') {
          setMatchingStatus('matched');
          setMatchedRoomId(response.roomId || null);
          setMatchedMbti(response.partner?.mbti || '???');
          void loadChatRooms();

          // WebSocket 연결 해제
          if (matchWsRef.current) {
            matchWsRef.current.close();
            matchWsRef.current = null;
          }
          return;
        }

        // 다음 레벨로 순환 (1 -> 2 -> 3 -> 4 -> 1 -> ...)
        levelIndex = (levelIndex + 1) % MATCHING_LEVELS.length;

        // 다음 요청 전 대기
        await sleep(MATCHING_INTERVAL * 1000);
      }

      console.log('[매칭] 취소됨 - 루프 종료');

    } catch (err) {
      console.error('매칭 요청 실패:', err);
      setMatchingError('매칭 요청에 실패했습니다. 다시 시도해주세요.');
      setMatchingStatus('idle');

      // WebSocket 연결 해제
      if (matchWsRef.current) {
        matchWsRef.current.close();
        matchWsRef.current = null;
      }

      // 에러 발생 시 대기열 정리
      try {
        await cancelMatch({ user_id: user.id, mbti: profile.mbti });
      } catch {
        // 취소 실패는 무시
      }
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const handleCancelMatching = async () => {
    if (!user?.id || !profile?.mbti) return;

    setIsMatchingLoading(true);

    // WebSocket 연결 해제
    if (matchWsRef.current) {
      matchWsRef.current.close();
      matchWsRef.current = null;
    }

    try {
      await cancelMatch({
        user_id: user.id,
        mbti: profile.mbti,
      });

      setMatchingStatus('idle');
      setWaitCount(0);
    } catch (err) {
      console.error('매칭 취소 실패:', err);
      setMatchingError('매칭 취소에 실패했습니다.');
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const handleGoToChat = () => {
    if (matchedRoomId) {
      router.push(`/chat/${matchedRoomId}`);
    }
  };

  const handleRoomClick = (roomId: string) => {
    router.push(`/chat/${roomId}`);
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 매칭 섹션 */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">새로운 대화 시작하기</h2>
          {profile?.mbti && (
            <p className="text-sm text-purple-600 mt-1">내 MBTI: {profile.mbti}</p>
          )}
        </div>

        {matchingStatus === 'idle' && (
          <div className="text-center">
            {matchingError && (
              <p className="text-red-500 text-sm mb-4">{matchingError}</p>
            )}
            <button
              onClick={handleStartMatching}
              disabled={isMatchingLoading}
              className="w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-medium text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMatchingLoading ? '처리 중...' : '매칭 시작하기'}
            </button>
            <p className="text-gray-400 text-xs mt-3">
              무료 사용자는 하루 3회까지 매칭할 수 있습니다
            </p>
          </div>
        )}

        {matchingStatus === 'waiting' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">{matchingMessage}</p>
                <p className="text-sm text-gray-500">대기 인원: {waitCount}명</p>
              </div>
            </div>
            <button
              onClick={handleCancelMatching}
              disabled={isMatchingLoading}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition disabled:opacity-50"
            >
              {isMatchingLoading ? '처리 중...' : '매칭 취소'}
            </button>
          </div>
        )}

        {matchingStatus === 'matched' && (
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block bg-gradient-to-r from-green-400 to-emerald-400 text-white px-4 py-2 rounded-full text-sm font-medium mb-2">
                매칭 성공!
              </div>
              <p className="text-gray-600">상대방 MBTI: <span className="font-bold text-purple-600">{matchedMbti}</span></p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGoToChat}
                className="flex-1 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-medium hover:opacity-90 transition"
              >
                채팅 시작
              </button>
              <button
                onClick={() => {
                  setMatchingStatus('idle');
                  setMatchedMbti(null);
                  setMatchedRoomId(null);
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition"
              >
                다시 매칭
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 채팅 목록 섹션 */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">채팅 목록</h2>
        </div>

        {isLoadingRooms ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-500">아직 채팅방이 없어요</p>
            <p className="text-gray-400 text-sm mt-1">위에서 매칭을 시작해보세요!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chatRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomClick(room.id)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition text-left"
              >
                {/* 상대방 아바타 */}
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {room.partnerMbti ? room.partnerMbti.slice(0, 2) : '??'}
                </div>

                {/* 채팅 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">
                      {room.partnerMbti || `상대방`}
                    </span>
                    <span className="text-xs text-gray-400">{room.lastMessageTime}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{room.lastMessage}</p>
                </div>

                {/* 안 읽은 메시지 */}
                {room.unreadCount > 0 && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {room.unreadCount}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}