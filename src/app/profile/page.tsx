'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { updateProfile, type Gender } from '@/lib/api';

const mbtiPairs = [
  { options: ['E', 'I'], labels: ['외향', '내향'] },
  { options: ['S', 'N'], labels: ['감각', '직관'] },
  { options: ['T', 'F'], labels: ['사고', '감정'] },
  { options: ['J', 'P'], labels: ['판단', '인식'] },
];

export default function ProfilePage() {
  const router = useRouter();
  const [mbtiSelections, setMbtiSelections] = useState<(string | null)[]>([null, null, null, null]);
  const [gender, setGender] = useState<Gender | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mbti = mbtiSelections.every(s => s !== null) ? mbtiSelections.join('') : '';

  const handleMbtiSelect = (index: number, value: string) => {
    const newSelections = [...mbtiSelections];
    newSelections[index] = value;
    setMbtiSelections(newSelections);
  };

  const handleSubmit = async () => {
    if (!mbti || !gender) {
      alert('MBTI와 성별을 모두 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({ mbti, gender });
      alert('프로필이 저장되었습니다.');
      router.push('/consult');
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-sm space-y-8">
          <div className="text-center space-y-2">
            <div className="text-4xl">📝</div>
            <h1 className="text-2xl font-bold text-gray-700">프로필 설정</h1>
            <p className="text-gray-500 text-sm">MBTI와 성별을 선택해주세요</p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-600">
              MBTI
            </label>
            <div className="space-y-3">
              {mbtiPairs.map((pair, index) => (
                <div key={index} className="flex gap-3">
                  {pair.options.map((option, optionIndex) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleMbtiSelect(index, option)}
                      className={`cursor-pointer flex-1 py-4 rounded-xl font-semibold transition ${
                        mbtiSelections[index] === option
                          ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-lg">{option}</div>
                      <div className="text-xs opacity-70">{pair.labels[optionIndex]}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {mbti && (
              <div className="p-4 bg-pink-50 rounded-xl text-center">
                <p className="text-xs text-gray-500">선택한 MBTI</p>
                <p className="text-xl font-bold text-pink-500">{mbti}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-600">
              성별
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '남성', value: 'MALE' as Gender },
                { label: '여성', value: 'FEMALE' as Gender },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setGender(item.value)}
                  className={`cursor-pointer px-6 py-4 rounded-xl transition text-left ${
                    gender === item.value
                      ? 'bg-purple-100 border-2 border-purple-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-xs text-gray-600">
                    {item.value === 'MALE' ? 'MALE' : 'FEMALE'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="cursor-pointer w-full py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}

