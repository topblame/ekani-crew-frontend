'use client';

import { useState, useEffect } from 'react';
import { getConsultHistory, ConsultHistorySession } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function MypageClient() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ConsultHistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getConsultHistory();
        setSessions(response.sessions);
      } catch (err: any) {
        setError(err.message || '히스토리를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-sm mb-6">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-pink-500 mb-2">마이페이지</h1>
          <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-purple-500 mb-4">📋 상담 히스토리</h2>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">로딩 중...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            아직 완료된 상담이 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <div className="text-left">
                      <div className="font-medium text-gray-700">
                        {formatDate(session.created_at)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {session.mbti} / {session.gender === 'MALE' ? '남성' : '여성'}
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {expandedId === session.id ? '▲' : '▼'}
                  </span>
                </button>

                {expandedId === session.id && session.analysis && (
                  <div className="border-t bg-gradient-to-b from-purple-50 to-pink-50 p-4 space-y-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <h3 className="font-semibold text-pink-500 mb-1">📝 상황 정리</h3>
                      <p className="text-gray-700 text-sm whitespace-pre-line">
                        {session.analysis.situation}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <h3 className="font-semibold text-purple-500 mb-1">🧠 MBTI 특성 분석</h3>
                      <p className="text-gray-700 text-sm whitespace-pre-line">
                        {session.analysis.traits}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <h3 className="font-semibold text-green-500 mb-1">💡 솔루션</h3>
                      <p className="text-gray-700 text-sm whitespace-pre-line">
                        {session.analysis.solutions}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <h3 className="font-semibold text-orange-500 mb-1">⚠️ 주의사항</h3>
                      <p className="text-gray-700 text-sm whitespace-pre-line">
                        {session.analysis.cautions}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
