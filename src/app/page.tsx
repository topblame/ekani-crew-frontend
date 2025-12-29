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
          href="/mbti-test"
          className="inline-block px-8 py-4 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          무료 MBTI 검사 시작하기
        </Link>
      </section>

      {/* 서비스 카드 */}
      <section className="grid md:grid-cols-2 gap-6">
        {/* MBTI 검사 - 메인 카드 */}
        <Link href="/mbti-test" className="block bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:scale-[1.02] transition border-2 border-indigo-200 relative overflow-hidden cursor-pointer">
          <div className="absolute top-3 right-3 px-2 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
            NEW
          </div>
          <div className="text-4xl mb-4">🧠</div>
          <h2 className="text-xl font-bold text-indigo-600 mb-2">MBTI 검사</h2>
          <p className="text-gray-600 mb-2">
            기존에 알던 것과는 다른 방식으로 나의 MBTI를 알아보세요.
          </p>
          <div className="text-xs text-indigo-600 bg-indigo-100 rounded-lg p-2 mb-4">
            <span className="font-semibold">차별점:</span> 객관식이 아닌 채팅 형식으로, 내 답변에 따라 맞춤 질문을 생성합니다
          </div>
          <span className="text-indigo-500 font-medium">
            무료 검사하기 →
          </span>
        </Link>

        <Link href="/convert" className="block bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg hover:scale-[1.02] transition cursor-pointer">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-xl font-bold text-purple-500 mb-2">메시지 변환</h2>
          <p className="text-gray-500 mb-4">
            상대방의 MBTI에 맞게 메시지를 변환해드려요.
            공손한, 캐주얼한, 간결한 3가지 버전으로!
          </p>
          <span className="text-purple-400 font-medium">
            변환하기 →
          </span>
        </Link>
      </section>

      {/* 서비스 소개 */}
      <section className="bg-white rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-center text-gray-700 mb-2">
          눈치코치가 뭐야?
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          MBTI 검사부터 메시지 변환, 매칭까지<br />
          AI가 당신의 소통을 도와드려요
        </p>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-indigo-50">
            <span className="text-3xl">🧠</span>
            <div>
              <h3 className="font-bold text-indigo-600 mb-2">채팅형 MBTI 검사</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                "동의/비동의" 클릭하는 지루한 검사는 이제 그만!
                눈치코치의 MBTI 검사는 채팅으로 진행돼요.
                내 답변에 따라 AI가 맞춤 질문을 생성하니까 더 정확한 결과를 얻을 수 있어요.
                24개의 질문이 끝나면 각 차원별 비율까지 상세하게 분석해드려요.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-pink-50">
            <span className="text-3xl">🗣️</span>
            <div>
              <h3 className="font-bold text-pink-600 mb-2">폼 말고 대화로</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                "동의/비동의" 버튼만 누르는 딱딱한 검사는 그만!
                친구한테 털어놓듯 AI와 자연스럽게 대화하면서 MBTI를 알아보세요.
                AI가 맥락을 파악해서 알아서 맞춤 질문을 생성해줘요.
                24개의 질문이 끝나면 각 차원별 비율까지 상세하게 분석해드려요.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-purple-50">
            <span className="text-3xl">📋</span>
            <div>
              <h3 className="font-bold text-purple-600 mb-2">바로 쓸 수 있는 메시지</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                "INTJ는 논리적이에요~" 같은 뻔한 이론 설명은 이제 지겨우시죠?
                눈치코치는 복사해서 바로 보낼 수 있는 실제 메시지를 만들어줘요.
                공손한 버전, 캐주얼한 버전, 간결한 버전 3가지로 제공되니까
                상황에 맞게 골라서 쓰시면 돼요. 각 버전마다 왜 이 표현이 효과적인지 해설도 함께!
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-rose-50">
            <span className="text-3xl">💕</span>
            <div>
              <h3 className="font-bold text-rose-600 mb-2">MBTI 매칭</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                같은 MBTI를 가진 사람들과 익명으로 대화해보세요!
                나와 같은 유형의 사람들은 어떤 생각을 하는지, 어떤 고민이 있는지 공유할 수 있어요.
                매칭이 되면 1:1 채팅방이 생성되고, 부담 없이 대화를 나눌 수 있어요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 사용 후기 */}
      <section className="bg-white rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-center text-gray-700 mb-6">
          사용 후기
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-pink-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💘</span>
              <span className="font-bold text-pink-600">INFP</span>
              <span className="text-xs text-gray-400">메시지 변환 이용</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              "INTJ 썸녀한테 어떻게 말해야 할지 몰라서 맨날 읽씹당했는데,
              여기서 변환한 메시지로 보내니까 바로 답장 옴ㅋㅋ
              결국 고백도 성공했습니다. 진짜 감사해요!"
            </p>
            <div className="text-xs text-pink-400">⭐⭐⭐⭐⭐</div>
          </div>
          <div className="p-5 rounded-2xl bg-purple-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💼</span>
              <span className="font-bold text-purple-600">ENFP</span>
              <span className="text-xs text-gray-400">메시지 변환 이용</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              "ISTJ 팀장님한테 보고할 때 어떻게 말해야 할지 몰랐는데,
              여기서 변환한 메시지로 보내니까 바로 OK 받았어요.
              요즘 팀장님이 제 보고서 칭찬해주세요!"
            </p>
            <div className="text-xs text-purple-400">⭐⭐⭐⭐⭐</div>
          </div>
          <div className="p-5 rounded-2xl bg-indigo-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🧠</span>
              <span className="font-bold text-indigo-600">ISTP</span>
              <span className="text-xs text-gray-400">MBTI 검사 이용</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              "다른 사이트에서는 맨날 다른 결과 나왔는데
              여기는 채팅으로 해서 그런지 제일 정확한 것 같아요.
              질문도 제 답변에 맞춰서 나와서 신기했음"
            </p>
            <div className="text-xs text-indigo-400">⭐⭐⭐⭐⭐</div>
          </div>
          <div className="p-5 rounded-2xl bg-rose-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">👥</span>
              <span className="font-bold text-rose-600">INFJ</span>
              <span className="text-xs text-gray-400">매칭 이용</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              "같은 INFJ랑 대화하니까 말 안 해도 서로 이해돼서 좋았어요.
              평소에 공감 받기 힘들었는데 여기서 위로 많이 받았습니다 ㅠㅠ"
            </p>
            <div className="text-xs text-rose-400">⭐⭐⭐⭐⭐</div>
          </div>
        </div>
      </section>
    </div>
  );
}