'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { signup, type Gender } from '@/lib/api';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    gender: '',
    mbtiBase: '', // 기본 4-letter
    mbtiAssertive: '', // A/T
    mbtiOpen: '', // O/S
    mbtiRational: '', // R/I
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 구글 로그인 후 이메일 자동 채우기
  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    if (emailFromQuery) {
      setFormData(prev => ({ ...prev, email: emailFromQuery }));
    } else if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [searchParams, user]);

  const mbtiTypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP',
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      // 기본 정보 검증
      if (!formData.email || !formData.password || !formData.nickname || !formData.gender) {
        alert('모든 필드를 입력해주세요.');
        return;
      }
    } else if (step === 2) {
      // MBTI 기본 검증
      if (!formData.mbtiBase) {
        alert('MBTI를 선택해주세요.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    // 확장 MBTI 검증
    if (!formData.mbtiAssertive || !formData.mbtiOpen || !formData.mbtiRational) {
      alert('모든 MBTI 확장 정보를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const mbti7Letter = `${formData.mbtiBase}-${formData.mbtiAssertive}${formData.mbtiOpen}${formData.mbtiRational}`;
      
      await signup({
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
        gender: formData.gender as Gender,
        mbti7Letter,
      });

      alert('회원가입이 완료되었습니다!');
      router.push('/');
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert('회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMbti7Letter = () => {
    if (!formData.mbtiBase) return '';
    return `${formData.mbtiBase}-${formData.mbtiAssertive || '_'}${formData.mbtiOpen || '_'}${formData.mbtiRational || '_'}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-sm">
        {/* 진행 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">단계 {step} / 3</span>
            <span className="text-sm font-medium text-pink-500">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-400 to-purple-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">👤</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">기본 정보 입력</h2>
              <p className="text-gray-500">회원가입에 필요한 기본 정보를 입력해주세요</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              <p className="text-xs text-gray-400 mt-1">구글 로그인 시 자동으로 채워집니다</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                닉네임 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                placeholder="사용할 닉네임을 입력하세요"
                className="w-full px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                성별 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '남성', value: 'MALE' as Gender },
                  { label: '여성', value: 'FEMALE' as Gender },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleInputChange('gender', item.value)}
                    className={`px-4 py-3 rounded-xl font-medium transition ${
                      formData.gender === item.value
                        ? 'bg-pink-400 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: MBTI 기본 4-letter */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🧩</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">MBTI 기본 유형</h2>
              <p className="text-gray-500">당신의 기본 MBTI 유형을 선택해주세요</p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {mbtiTypes.map((mbti) => (
                <button
                  key={mbti}
                  type="button"
                  onClick={() => handleInputChange('mbtiBase', mbti)}
                  className={`px-4 py-4 rounded-xl font-bold text-sm transition ${
                    formData.mbtiBase === mbti
                      ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mbti}
                </button>
              ))}
            </div>

            {formData.mbtiBase && (
              <div className="mt-4 p-4 bg-pink-50 rounded-xl text-center">
                <p className="text-sm text-gray-600">선택한 MBTI</p>
                <p className="text-2xl font-bold text-pink-500 mt-1">{formData.mbtiBase}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: MBTI 확장 3가지 */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">MBTI 확장 정보</h2>
              <p className="text-gray-500">더 정확한 분석을 위한 추가 정보를 선택해주세요</p>
            </div>

            {/* A/T */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">
                1. A (Assertive) / T (Turbulent) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('mbtiAssertive', 'A')}
                  className={`px-6 py-4 rounded-xl text-left transition ${
                    formData.mbtiAssertive === 'A'
                      ? 'bg-pink-100 border-2 border-pink-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-bold text-lg mb-1">A (Assertive)</div>
                  <div className="text-xs text-gray-600">
                    자신감, 스트레스 덜 받음, 독립적
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('mbtiAssertive', 'T')}
                  className={`px-6 py-4 rounded-xl text-left transition ${
                    formData.mbtiAssertive === 'T'
                      ? 'bg-pink-100 border-2 border-pink-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-bold text-lg mb-1">T (Turbulent)</div>
                  <div className="text-xs text-gray-600">
                    신중함, 완벽주의, 타인 평가 민감
                  </div>
                </button>
              </div>
            </div>

            {/* O/S */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">
                2. O (Open) / S (Stable) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('mbtiOpen', 'O')}
                  className={`px-6 py-4 rounded-xl text-left transition ${
                    formData.mbtiOpen === 'O'
                      ? 'bg-purple-100 border-2 border-purple-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-bold text-lg mb-1">O (Open)</div>
                  <div className="text-xs text-gray-600">
                    변화 선호, 새로운 시도 즐김, 유연
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('mbtiOpen', 'S')}
                  className={`px-6 py-4 rounded-xl text-left transition ${
                    formData.mbtiOpen === 'S'
                      ? 'bg-purple-100 border-2 border-purple-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-bold text-lg mb-1">S (Stable)</div>
                  <div className="text-xs text-gray-600">
                    안정 추구, 익숙한 것 선호, 체계적
                  </div>
                </button>
              </div>
            </div>

            {/* R/I */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">
                3. R (Rational) / I (Impulsive) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('mbtiRational', 'R')}
                  className={`px-6 py-4 rounded-xl text-left transition ${
                    formData.mbtiRational === 'R'
                      ? 'bg-pink-100 border-2 border-pink-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-bold text-lg mb-1">R (Rational)</div>
                  <div className="text-xs text-gray-600">
                    논리적 분석 후 결정, 신중한 판단
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('mbtiRational', 'I')}
                  className={`px-6 py-4 rounded-xl text-left transition ${
                    formData.mbtiRational === 'I'
                      ? 'bg-pink-100 border-2 border-pink-400'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-bold text-lg mb-1">I (Impulsive)</div>
                  <div className="text-xs text-gray-600">
                    직관 따름, 빠른 결단, 즉흥적
                  </div>
                </button>
              </div>
            </div>

            {/* 최종 MBTI 7-letter 미리보기 */}
            {formData.mbtiBase && (
              <div className="mt-6 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl text-center border-2 border-pink-200">
                <p className="text-sm text-gray-600 mb-2">최종 MBTI</p>
                <p className="text-3xl font-bold text-pink-500">
                  {getMbti7Letter()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-full font-medium hover:bg-gray-200 transition"
            >
              이전
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-semibold hover:shadow-lg transition"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : '회원가입 완료'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}

