'use client';

import { useState, useEffect, useRef } from 'react';
import { startConsult, sendConsultMessage, Analysis } from '@/lib/api';

export default function ConsultClient() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [remainingTurns, setRemainingTurns] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 자동으로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleStart = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await startConsult();
      setSessionId(response.session_id);
      setIsStarted(true);
      setMessages([
        { role: 'assistant', content: response.greeting }
      ]);
    } catch (err: any) {
      setError(err.message || '상담 시작 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isCompleted) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setError('');

    try {
      const response = await sendConsultMessage(sessionId, userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
      setRemainingTurns(response.remaining_turns);
      setIsCompleted(response.is_completed);
      if (response.analysis) {
        setAnalysis(response.analysis);
      }
    } catch (err: any) {
      setError(err.message || '메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
          <div className="text-6xl mb-6">💭</div>
          <h1 className="text-2xl font-bold text-pink-500 mb-4">MBTI 상담 시작하기</h1>
          <p className="text-gray-500 mb-8">
            5턴의 대화를 통해 당신의 관계 고민을 분석해드릴게요.
            <br />
            상담이 끝나면 맞춤형 솔루션을 제공해드려요!
          </p>
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-600 rounded-lg">
              {error}
            </div>
          )}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="cursor-pointer px-8 py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '시작 중...' : '상담 시작하기'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-pink-400 to-purple-400 text-white p-4">
          <h1 className="font-bold">MBTI 상담</h1>
          <p className="text-sm text-white/80">남은 턴: {remainingTurns}/5</p>
        </div>

        {/* 메시지 영역 */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-pink-400 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
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

        {/* 분석 결과 */}
        {isCompleted && analysis && (
          <div className="border-t bg-gradient-to-b from-purple-50 to-pink-50 p-4 space-y-4">
            <h2 className="text-lg font-bold text-purple-600 text-center">📊 상담 분석 결과</h2>

            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <h3 className="font-semibold text-pink-500 mb-1">📝 상황 정리</h3>
                <p className="text-gray-700 text-sm whitespace-pre-line">{analysis.situation}</p>
              </div>

              <div className="bg-white rounded-xl p-3 shadow-sm">
                <h3 className="font-semibold text-purple-500 mb-1">🧠 MBTI 특성 분석</h3>
                <p className="text-gray-700 text-sm whitespace-pre-line">{analysis.traits}</p>
              </div>

              <div className="bg-white rounded-xl p-3 shadow-sm">
                <h3 className="font-semibold text-green-500 mb-1">💡 솔루션</h3>
                <p className="text-gray-700 text-sm whitespace-pre-line">{analysis.solutions}</p>
              </div>

              <div className="bg-white rounded-xl p-3 shadow-sm">
                <h3 className="font-semibold text-orange-500 mb-1">⚠️ 주의사항</h3>
                <p className="text-gray-700 text-sm whitespace-pre-line">{analysis.cautions}</p>
              </div>
            </div>
          </div>
        )}

        {/* 입력 영역 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && !isCompleted && handleSend()}
              placeholder={isCompleted ? "상담이 완료되었습니다" : "고민을 말해주세요..."}
              disabled={isLoading || isCompleted}
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || isCompleted || !input.trim()}
              className="px-6 py-3 bg-pink-400 text-white rounded-full font-medium hover:bg-pink-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '전송 중...' : '전송'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}