'use client';

import { useState } from 'react';
import { convertMessage, ToneMessage } from '@/lib/api';

export default function ConvertClient() {
  const [message, setMessage] = useState('');
  const [senderMbti, setSenderMbti] = useState('');
  const [receiverMbti, setReceiverMbti] = useState('');
  const [results, setResults] = useState<ToneMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const mbtiTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];

  const handleConvert = async () => {
    if (!message.trim() || !senderMbti || !receiverMbti) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await convertMessage({
        original_message: message,
        sender_mbti: senderMbti,
        receiver_mbti: receiverMbti,
      });
      setResults(response.tones);
    } catch (err: any) {
      setError(err.message || '변환 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-purple-500 mb-2">메시지 변환</h1>
        <p className="text-gray-500">상대방의 MBTI에 맞게 메시지를 변환해드려요</p>
      </div>

      {/* 입력 폼 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">내 MBTI</label>
            <select
              value={senderMbti}
              onChange={(e) => setSenderMbti(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">선택하세요</option>
              {mbtiTypes.map(mbti => (
                <option key={mbti} value={mbti}>{mbti}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">상대방 MBTI</label>
            <select
              value={receiverMbti}
              onChange={(e) => setReceiverMbti(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="">선택하세요</option>
              {mbtiTypes.map(mbti => (
                <option key={mbti} value={mbti}>{mbti}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">변환할 메시지</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="변환하고 싶은 메시지를 입력하세요..."
            className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 h-24 resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '변환 중...' : '변환하기'}
        </button>
      </div>

      {/* 결과 */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-700">변환 결과</h2>
          {results.map((result, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                  {result.tone}
                </span>
              </div>
              <p className="text-gray-700 mb-2">{result.content}</p>
              <p className="text-sm text-gray-400">{result.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}