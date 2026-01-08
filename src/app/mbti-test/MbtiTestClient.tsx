'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { startMbtiTest, checkAuthStatus, answerMbtiQuestion, getMbtiResult, resumeMbtiTest, restartMbtiTest, getMbtiTestStatus } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const TOTAL_QUESTIONS = 24;

export default function MbtiTestClient() {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [mbtiResult, setMbtiResult] = useState<string | null>(null);
  const [hasInProgressTest, setHasInProgressTest] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // 스크롤이 바닥에 있는지 체크
  const isAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    setIsUserScrolling(!isAtBottom());
  }, [isAtBottom]);

  // 메시지가 추가될 때 자동 스크롤 (사용자가 스크롤 중이 아닐 때만)
  useEffect(() => {
    if (!isUserScrolling && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, isUserScrolling]);

  // 로딩이 끝나면 input에 포커스 유지
  useEffect(() => {
    if (!isLoading && !isCompleted && isStarted) {
      inputRef.current?.focus();
    }
  }, [isLoading, isCompleted, isStarted]);


  useEffect(() => {
    const checkUser = async () => {
      try {
        const status = await checkAuthStatus();
        setIsLoggedIn(status.logged_in);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkUser();
  }, []);

  // 진행 중인 테스트 확인
  useEffect(() => {
    const checkInProgress = async () => {
      if (!isLoggedIn) return;
      try {
        const status = await getMbtiTestStatus();
        setHasInProgressTest(status.status === 'in_progress');
      } catch {
        setHasInProgressTest(false);
      }
    };
    checkInProgress();
  }, [isLoggedIn]);

  const handleStart = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await startMbtiTest('human');
      setSessionId(response.session.id);
      // greeting 메시지를 먼저 표시 (아직 질문 시작 전)
      setMessages([{ role: 'assistant', content: response.first_question.content }]);
      setQuestionNumber(0);  // greeting은 질문이 아님
      setIsStarted(true);
    } catch (err: any) {
      if (err.message?.includes('401')) {
        setError('로그인이 필요합니다.');
      } else {
        setError(err.message || 'MBTI 테스트 시작 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    setError('');

    console.log('\n========== RESUME FLOW START ==========');

    try {
      console.log('[FRONTEND] Calling resumeMbtiTest API...');
      const response = await resumeMbtiTest();

      console.log('[FRONTEND] ===== RAW API RESPONSE =====');
      console.log(JSON.stringify(response, null, 2));
      console.log('[FRONTEND] ===========================');

      console.log('[FRONTEND] Resume response received:');
      console.log('  - Status:', response.status);
      console.log('  - Session ID:', response.session?.id);
      console.log('  - Session turns:', response.session?.turns?.length || 0);
      console.log('  - Messages field exists:', 'messages' in response);
      console.log('  - Messages count:', response.messages?.length || 0);
      console.log('  - Messages data:', response.messages);
      console.log('  - Next question:', response.next_question?.content);

      setSessionId(response.session.id);

      // 백엔드에서 받은 messages 사용 (이전 대화 내용)
      let restoredMessages: Message[] = [];

      // messages 필드가 있는지 확인
      if (response.messages && Array.isArray(response.messages)) {
        console.log('[FRONTEND] Using messages field from API');
        restoredMessages = response.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content || '',
        }));
      }
      // messages 필드가 없으면 session.turns에서 변환
      else if (response.session?.turns && Array.isArray(response.session.turns)) {
        console.log('[FRONTEND] Converting from session.turns (fallback)');
        response.session.turns.forEach((turn: any) => {
          restoredMessages.push({ role: 'assistant', content: turn.question });
          restoredMessages.push({ role: 'user', content: turn.answer });
        });
      } else {
        console.warn('[FRONTEND] No messages or turns found in response!');
      }

      console.log('[FRONTEND] Restored messages count:', restoredMessages.length);

      // 각 메시지 상세 출력
      restoredMessages.forEach((msg, i) => {
        console.log(`[FRONTEND] Message ${i}:`, {
          role: msg.role,
          content: msg.content,
          contentLength: msg.content?.length || 0,
          contentType: typeof msg.content,
        });
      });

      // 다음 질문 추가
      if (response.next_question && response.next_question.content) {
        restoredMessages.push({ role: 'assistant', content: response.next_question.content });
        console.log('[FRONTEND] Added next_question, total messages now:', restoredMessages.length);
      }

      console.log('[FRONTEND] Final messages array:', restoredMessages);
      console.log('[FRONTEND] Setting messages state...');

      setMessages(restoredMessages);
      setQuestionNumber(response.session.current_question_index || Math.floor(restoredMessages.length / 2));
      setIsStarted(true);
      setHasInProgressTest(false);

      console.log('[FRONTEND] Messages state updated successfully');
      console.log('========== RESUME FLOW END ==========\n');
    } catch (err: any) {
      console.error('[FRONTEND] Resume error:', err);
      if (err.message?.includes('404')) {
        setError('진행 중인 테스트를 찾을 수 없습니다.');
        setHasInProgressTest(false);
      } else if (err.message?.includes('401')) {
        setError('로그인이 필요합니다.');
      } else {
        setError(err.message || '테스트 재개 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await restartMbtiTest('human');
      setSessionId(response.session.id);
      setMessages([{ role: 'assistant', content: response.first_question.content }]);
      setQuestionNumber(0);
      setIsStarted(true);
      setHasInProgressTest(false);
    } catch (err: any) {
      setError(err.message || '테스트 재시작 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isCompleted) return;

    const userAnswer = input.trim();
    setInput('');
    setIsUserScrolling(false); // 메시지 전송 시 자동 스크롤 활성화
    setMessages(prev => [...prev, { role: 'user', content: userAnswer }]);
    setIsLoading(true);
    setError('');

    try {
      // 통합 답변 엔드포인트 호출
      const response = await answerMbtiQuestion(sessionId, userAnswer);

      setQuestionNumber(response.question_number);

      if (response.is_completed) {
        // 테스트 완료
        setIsCompleted(true);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '테스트가 완료되었습니다! 결과를 분석 중입니다...' }
        ]);

        // 결과 API 호출
        try {
          const resultResponse = await getMbtiResult(sessionId);
          setMbtiResult(resultResponse.mbti);
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `당신의 MBTI는 ${resultResponse.mbti}입니다! 🎉`
            }
          ]);
        } catch {
          // 결과 조회 실패 시 fallback
          setMbtiResult('????');
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: '결과 조회에 실패했습니다. 다시 시도해주세요.' }
          ]);
        }
      } else if (response.next_question) {
        // 다음 질문 표시
        setMessages(prev => [...prev, { role: 'assistant', content: response.next_question!.content }]);
      }
    } catch (err: any) {
      setError(err.message || '질문 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 진행 단계 표시
  const getPhaseText = () => {
    if (isCompleted) return '테스트 완료!';
    if (questionNumber === 0) return '시작하기';
    return `진행 중: ${questionNumber}/${TOTAL_QUESTIONS}`;
  };

  // 진행률 계산
  const progress = Math.min((questionNumber / TOTAL_QUESTIONS) * 100, 100);

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
          <div className="text-6xl mb-6">🧠</div>
          <h1 className="text-2xl font-bold text-purple-500 mb-4">AI MBTI 검사</h1>
          <p className="text-gray-500 mb-4">
            16personalities와는 다른 방식의 MBTI 검사입니다.
            <br />
            O/X가 아닌 채팅 형식으로, 내 답변에 따라 맞춤 질문이 생성됩니다!
          </p>
          <div className="bg-purple-50 rounded-2xl p-4 mb-8">
            <p className="text-purple-700 text-sm">
              총 24개의 질문으로 구성되어 있습니다.
              <br />
              예상 소요시간: 약 10-15분
            </p>
          </div>
          {!isCheckingAuth && !isLoggedIn && (
            <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
              로그인 후 테스트를 진행할 수 있습니다.
              <button
                onClick={() => router.push('/login')}
                className="ml-2 underline hover:text-yellow-900"
              >
                로그인하기
              </button>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-3">
            {!hasInProgressTest ? (
              <button
                onClick={handleStart}
                disabled={isLoading || isCheckingAuth || !isLoggedIn}
                className="cursor-pointer px-8 py-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || isCheckingAuth ? '로딩 중...' : '검사 시작하기'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleResume}
                  disabled={isLoading || isCheckingAuth}
                  className="cursor-pointer px-8 py-4 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '로딩 중...' : '이어하기 ▶️'}
                </button>
                <button
                  onClick={handleRestart}
                  disabled={isLoading || isCheckingAuth}
                  className="cursor-pointer px-8 py-3 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '로딩 중...' : '새로하기 🔄'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white p-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-bold">AI MBTI 검사</h1>
            <span className="text-sm text-white/80">{getPhaseText()}</span>
          </div>
          {/* 진행률 바 */}
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 메시지 영역 */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-96 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((msg, idx) => {
            console.log(`[RENDER] Message ${idx}:`, msg);
            console.log(`[RENDER] - role: ${msg.role}`);
            console.log(`[RENDER] - content: "${msg.content}"`);
            console.log(`[RENDER] - content length: ${msg.content?.length || 0}`);

            return (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-purple-400 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                  }`}
                >
                  {msg.content || '[내용 없음]'}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-gray-100 text-gray-700 rounded-bl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 결과 영역 */}
        {isCompleted && mbtiResult && (
          <div className="px-4 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">당신의 MBTI</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {mbtiResult}
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={() => router.push('/chat')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full font-medium hover:opacity-90 transition"
                >
                  MBTI로 매칭하기
                </button>
                <button
                  onClick={() => {
                    setIsStarted(false);
                    setIsCompleted(false);
                    setMessages([]);
                    setSessionId('');
                    setQuestionNumber(1);
                    setMbtiResult(null);
                    setError('');
                  }}
                  className="px-6 py-2 text-purple-500 hover:text-purple-700 font-medium transition"
                >
                  다시하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 입력 영역 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && !isCompleted && handleSend()}
              placeholder={isCompleted ? '테스트가 완료되었습니다' : '답변을 입력해주세요...'}
              disabled={isLoading || isCompleted}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || isCompleted || !input.trim()}
              className="px-6 py-3 bg-purple-400 text-white rounded-full font-medium hover:bg-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '전송 중...' : '전송'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}