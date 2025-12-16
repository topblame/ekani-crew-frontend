import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* 히어로 섹션 */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-pink-500 mb-4">
          눈치, AI가 읽어줄게
        </h1>
        <p className="text-lg text-gray-500 mb-8">
          상대방의 속마음을 MBTI로 분석해드려요
        </p>
        <Link
          href="/consult"
          className="inline-block px-8 py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          무료 상담 시작하기
        </Link>
      </section>

      {/* 서비스 카드 */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition">
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-xl font-bold text-pink-500 mb-2">MBTI 상담</h2>
          <p className="text-gray-500 mb-4">
            나의 MBTI에 맞는 맞춤형 관계 조언을 받아보세요.
            5턴의 대화로 깊이 있는 분석을 제공합니다.
          </p>
          <Link href="/consult" className="text-pink-400 font-medium hover:underline">
            상담받기 →
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-xl font-bold text-purple-500 mb-2">메시지 변환</h2>
          <p className="text-gray-500 mb-4">
            상대방의 MBTI에 맞게 메시지를 변환해드려요.
            공손한, 캐주얼한, 간결한 3가지 버전으로!
          </p>
          <Link href="/convert" className="text-purple-400 font-medium hover:underline">
            변환하기 →
          </Link>
        </div>
      </section>

      {/* 서비스 소개 */}
      <section className="bg-white rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-center text-gray-700 mb-2">
          Nunchi.ai가 뭐야?
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          관계에서 뭐라고 말해야 할지 모르겠을 때,<br />
          AI가 상대방의 MBTI에 맞는 소통법을 알려줘요
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-pink-50">
            <span className="text-3xl">🗣️</span>
            <div>
              <h3 className="font-bold text-pink-600 mb-2">폼 말고 대화로</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                "상대방 MBTI 선택, 상황 선택, 관계 유형 선택..." 이런 딱딱한 폼 입력은 그만!
                친구한테 털어놓듯 AI와 자연스럽게 대화하면서 고민을 나눠보세요.
                AI가 맥락을 파악해서 알아서 필요한 질문을 해줘요.
                5턴의 대화가 끝나면 상황 분석, 해결 방안, 주의사항까지 종합 리포트로 정리해드려요.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-purple-50">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="font-bold text-purple-600 mb-2">바로 쓸 수 있는 메시지</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                "INTJ는 논리적이에요~" 같은 뻔한 이론 설명은 이제 지겨우시죠?
                Nunchi.ai는 복사해서 바로 보낼 수 있는 실제 메시지를 만들어줘요.
                공손한 버전, 캐주얼한 버전, 간결한 버전 3가지로 제공되니까
                상황에 맞게 골라서 쓰시면 돼요. 각 버전마다 왜 이 표현이 효과적인지 해설도 함께!
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-pink-50">
            <span className="text-3xl">🎯</span>
            <div>
              <h3 className="font-bold text-pink-600 mb-2">모든 관계에 적용</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                연애 상담만 되는 거 아니에요! 까다로운 직장 상사, 말이 안 통하는 동료,
                오해가 생긴 친구, 갈등 중인 가족까지 모든 인간관계에서 활용할 수 있어요.
                상대방의 MBTI 특성을 고려한 맞춤 소통법을 알려드리니까
                어떤 관계든 더 스마트하게 대화할 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MBTI 심층 분석 */}
      <section className="bg-white rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-center text-gray-700 mb-6">
          MBTI 심층 분석
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-2xl bg-pink-50">
            <div className="text-2xl font-bold text-pink-500 mb-1">E / I</div>
            <div className="text-xs text-gray-500">외향 / 내향</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-purple-50">
            <div className="text-2xl font-bold text-purple-500 mb-1">S / N</div>
            <div className="text-xs text-gray-500">감각 / 직관</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-pink-50">
            <div className="text-2xl font-bold text-pink-500 mb-1">T / F</div>
            <div className="text-xs text-gray-500">사고 / 감정</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-purple-50">
            <div className="text-2xl font-bold text-purple-500 mb-1">J / P</div>
            <div className="text-xs text-gray-500">판단 / 인식</div>
          </div>
        </div>
      </section>
    </div>
  );
}