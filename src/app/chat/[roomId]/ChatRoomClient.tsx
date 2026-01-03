'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getChatWebSocketUrl, getChatHistory, markRoomAsRead, leaveChatRoom, reportMessage, ChatWebSocketResponse, ReportReason } from '@/lib/api';

interface Message {
  id: string;
  senderId: string;
  content: string;
  isMine: boolean;
  timestamp: Date;
}

interface ChatRoomClientProps {
  roomId: string;
}

export default function ChatRoomClient({ roomId }: ChatRoomClientProps) {
  const router = useRouter();
  const { isLoggedIn, user, loading } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // 신고 관련 state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetMessage, setReportTargetMessage] = useState<Message | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<ReportReason[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // 스크롤이 바닥에 있는지 체크
  const isAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // 스크롤 이벤트 핸들러
  const handleScrollEvent = useCallback(() => {
    setIsUserScrolling(!isAtBottom());
  }, [isAtBottom]);

  // 자동 스크롤 (사용자가 스크롤 중이 아닐 때만)
  const scrollToBottom = useCallback(() => {
    if (!isUserScrolling && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [isUserScrolling]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 로그인 체크
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push('/login');
    }
  }, [loading, isLoggedIn, router]);

  // 채팅 히스토리 로드 및 읽음 처리
  useEffect(() => {
    const userId = user?.id;
    if (!userId || !roomId) return;

    const loadHistoryAndMarkRead = async () => {
      try {
        // 채팅 히스토리 로드
        const history = await getChatHistory(roomId);
        const loadedMessages: Message[] = history.messages.map((msg) => ({
          id: msg.id,
          senderId: msg.sender_id,
          content: msg.content,
          isMine: msg.sender_id === userId,
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);

        // 채팅방 읽음 처리
        await markRoomAsRead(roomId, userId);
      } catch (err) {
        console.error('채팅 히스토리 로드 실패:', err);
      }
    };

    loadHistoryAndMarkRead();
  }, [user?.id, roomId]);

  // WebSocket 연결
  useEffect(() => {
    if (!user?.id || !roomId) return;

    const wsUrl = getChatWebSocketUrl(roomId);
    console.log('WebSocket 연결 시도:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket 연결됨');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data: ChatWebSocketResponse = JSON.parse(event.data);
        const newMessage: Message = {
          id: data.message_id,
          senderId: data.sender_id,
          content: data.content,
          isMine: data.sender_id === user.id,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
      } catch (err) {
        console.error('메시지 파싱 실패:', err);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket 에러:', event);
      setError('채팅 연결에 문제가 발생했습니다.');
      setIsConnecting(false);
    };

    ws.onclose = () => {
      console.log('WebSocket 연결 종료');
      setIsConnected(false);
      setIsConnecting(false);
    };

    return () => {
      ws.close();
    };
  }, [user?.id, roomId]);

  const handleSend = () => {
    if (!input.trim() || !wsRef.current || !user?.id) return;

    const message = {
      sender_id: user.id,
      content: input.trim(),
    };

    wsRef.current.send(JSON.stringify(message));
    setInput('');
    setIsUserScrolling(false); // 메시지 전송 시 자동 스크롤 활성화

    // 포커스 유지
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 조합 중이면 무시 (IME 이중 입력 방지)
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLeaveChatRoom = async () => {
    if (!user?.id) return;

    setIsLeaving(true);
    try {
      await leaveChatRoom(roomId, user.id);
      // WebSocket 연결 해제
      if (wsRef.current) {
        wsRef.current.close();
      }
      router.push('/chat');
    } catch (err) {
      console.error('채팅방 나가기 실패:', err);
      setError('채팅방 나가기에 실패했습니다.');
    } finally {
      setIsLeaving(false);
      setShowLeaveModal(false);
    }
  };

  // 신고 모달 열기
  const openReportModal = (msg: Message) => {
    setReportTargetMessage(msg);
    setSelectedReasons([]);
    setReportSuccess(false);
    setShowReportModal(true);
  };

  // 신고 사유 토글
  const toggleReason = (reason: ReportReason) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  // 신고 제출
  const handleReport = async () => {
    if (!user?.id || !reportTargetMessage || selectedReasons.length === 0) return;

    setIsReporting(true);
    try {
      await reportMessage(reportTargetMessage.id, {
        reporter_id: user.id,
        reasons: selectedReasons,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportTargetMessage(null);
        setSelectedReasons([]);
        setReportSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('이미 신고한')) {
        setError('이미 신고한 메시지입니다.');
      } else {
        setError('신고 접수에 실패했습니다.');
      }
      setShowReportModal(false);
    } finally {
      setIsReporting(false);
    }
  };

  const REPORT_REASONS: { value: ReportReason; label: string }[] = [
    { value: 'ABUSE', label: '욕설/폭언' },
    { value: 'HARASSMENT', label: '성희롱' },
    { value: 'SPAM', label: '스팸' },
    { value: 'OTHER', label: '기타' },
  ];

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
      <div className="bg-white rounded-3xl shadow-lg flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        {/* 채팅방 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/chat')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-gray-800">채팅방</h1>
              <p className="text-xs text-gray-500">Room: {roomId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`}
              ></span>
              <span className="text-sm text-gray-500">
                {isConnecting ? '연결 중...' : isConnected ? '연결됨' : '연결 끊김'}
              </span>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="text-gray-400 hover:text-red-500 transition"
              title="채팅방 나가기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScrollEvent}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-lg text-center text-sm">
              {error}
            </div>
          )}

          {messages.length === 0 && !error && (
            <div className="text-center text-gray-400 py-12">
              <p className="text-4xl mb-4">👋</p>
              <p>대화를 시작해보세요!</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'} group`}
            >
              {/* 상대방 메시지일 때 신고 버튼 */}
              {!msg.isMine && (
                <button
                  onClick={() => openReportModal(msg)}
                  className="opacity-0 group-hover:opacity-100 self-center mr-2 text-gray-300 hover:text-red-400 transition"
                  title="신고하기"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </button>
              )}
              <div
                className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                  msg.isMine
                    ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.isMine ? 'text-white/70' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              disabled={!isConnected}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:border-purple-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!isConnected || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-2xl font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
        </div>
      </div>

      {/* 채팅방 나가기 확인 모달 */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">채팅방 나가기</h3>
            <p className="text-gray-600 mb-6">
              정말로 채팅방을 나가시겠습니까?<br />
              나가면 대화 내용을 더 이상 볼 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                disabled={isLeaving}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleLeaveChatRoom}
                disabled={isLeaving}
                className="flex-1 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                {isLeaving ? '나가는 중...' : '나가기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            {reportSuccess ? (
              <div className="text-center py-4">
                <div className="text-green-500 text-5xl mb-4">&#10003;</div>
                <p className="text-gray-800 font-medium">신고가 접수되었습니다</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-2">메시지 신고</h3>
                <p className="text-gray-500 text-sm mb-4">
                  신고 사유를 선택해주세요 (복수 선택 가능)
                </p>

                {/* 신고 대상 메시지 미리보기 */}
                {reportTargetMessage && (
                  <div className="bg-gray-100 rounded-lg p-3 mb-4 text-sm text-gray-600 max-h-20 overflow-y-auto">
                    &quot;{reportTargetMessage.content}&quot;
                  </div>
                )}

                {/* 신고 사유 선택 */}
                <div className="space-y-2 mb-6">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                        selectedReasons.includes(reason.value)
                          ? 'bg-red-50 border-2 border-red-400'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReasons.includes(reason.value)}
                        onChange={() => toggleReason(reason.value)}
                        className="w-4 h-4 text-red-500 rounded"
                      />
                      <span className="text-gray-700">{reason.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setReportTargetMessage(null);
                      setSelectedReasons([]);
                    }}
                    disabled={isReporting}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleReport}
                    disabled={isReporting || selectedReasons.length === 0}
                    className="flex-1 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReporting ? '신고 중...' : '신고하기'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}