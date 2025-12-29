import { env } from './env';

// 백엔드 API URL 설정
const API_BASE_URL = env.API_BASE_URL;

export type Gender = 'MALE' | 'FEMALE';

export interface AuthStatus {
  logged_in: boolean;
  user_id?: string;
  email?: string;
  name?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  mbti: string | null;
  gender: Gender | null;
}

/**
 * 백엔드 API 호출 (쿠키 자동 포함)
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // body가 있는 경우에만 Content-Type 헤더 추가
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // 쿠키 포함
    headers,
  });

  if (!response.ok) {
    const errorDetails = {
      status: response.status,
      statusText: response.statusText,
      url: url,
    };
    console.error('API Error:', errorDetails);
    throw new Error(`API Error: ${response.statusText} (${response.status}) - ${endpoint}`);
  }

  const contentType = response.headers.get('content-type');
  const hasBody =
    contentType && !contentType.startsWith('text/plain') && contentType.includes('application/json');

  // 204나 빈 응답일 때는 undefined 반환
  if (response.status === 204 || !hasBody) {
    return undefined as T;
  }

  return response.json();
}

/**
 * 로그인 상태 확인
 */
export async function checkAuthStatus(): Promise<AuthStatus> {
  return apiFetch<AuthStatus>('/auth/status');
}

/**
 * 로그아웃
 */
export async function logout(sessionId?: string): Promise<void> {
  const headers = sessionId ? { Authorization: `Bearer ${sessionId}` } : undefined;

  // 우선 /auth/logout 시도, 404면 /logout로 한 번 더 시도
  try {
    await apiFetch<void>('/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers,
    });
    return;
  } catch (error: any) {
    const message = error?.message || '';
    if (!message.includes('404')) {
      throw error;
    }
  }

  // fallback: prefix 없는 경로
  await apiFetch<void>('/logout', {
    method: 'POST',
    credentials: 'include',
    headers,
  });
}

/**
 * 프로필 조회
 */
export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/user/profile', {
    method: 'GET',
  });
}

/**
 * 회원가입 (추가 정보 입력)
 */
export interface SignupData {
  email: string;
  password: string;
  nickname: string;
  gender: Gender;
  mbti7Letter: string; // 예: "INTJ-ATO"
}

export async function signup(data: SignupData): Promise<void> {
  return apiFetch<void>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 프로필 업데이트 (MBTI 4글자, 성별)
 */
export interface UpdateProfileData {
  mbti: string; // 예: "INTJ"
  gender: Gender; // MALE / FEMALE
}

export async function updateProfile(
  data: UpdateProfileData,
  sessionId?: string
): Promise<void> {
  return apiFetch<void>('/user/profile', {
    method: 'PUT',
    headers: sessionId ? { Authorization: `Bearer ${sessionId}` } : undefined,
    body: JSON.stringify(data),
  });
}

/**
 * 메시지 변환 (3가지 톤)
 */
export interface ConvertRequest {
  original_message: string;
  sender_mbti: string;
  receiver_mbti: string;
}

export interface ToneMessage {
  tone: string;
  content: string;
  explanation: string;
}

export interface ConvertResponse {
  tones: ToneMessage[];
}

export async function convertMessage(data: ConvertRequest): Promise<ConvertResponse> {
  return apiFetch<ConvertResponse>('/converter/convert-three-tones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * MBTI 테스트 시작
 */
export type MbtiTestType = 'human' | 'ai';

export interface MbtiTestSession {
  id: string;
  user_id: string;
  test_type: MbtiTestType;
  status: 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  questions: string[];
  answers: Record<string, unknown>[];
  current_question_index: number;
}

export interface MbtiMessage {
  role: 'user' | 'assistant';
  content: string;
  source: 'human' | 'ai';
}

export interface StartMbtiTestResponse {
  session: MbtiTestSession;
  first_question: MbtiMessage;
}

export async function startMbtiTest(testType: MbtiTestType = 'human'): Promise<StartMbtiTestResponse> {
  return apiFetch<StartMbtiTestResponse>(`/mbti-test/start?test_type=${testType}`, {
    method: 'POST',
  });
}

/**
 * MBTI 테스트 질문 답변 (통합 엔드포인트)
 * - 질문 1-12: 저장된 인간 질문 반환
 * - 질문 13-24: AI 생성 질문 반환
 */
export interface AnswerQuestionRequest {
  content: string;
}

export interface MbtiAnalysisResult {
  mbti: string;
  scores: Record<string, number>;
  confidence: Record<string, number>;
}

export interface PartialMbtiAnalysisResult {
  mbti: string;
  scores: Record<string, number>;
  completed_dimensions: string[];
}

export interface AnswerQuestionResponse {
  question_number: number;
  total_questions: number;
  next_question: MbtiMessage | null;
  is_completed: boolean;
  analysis_result?: MbtiAnalysisResult | null;
  partial_analysis_result?: PartialMbtiAnalysisResult | null;
}

export async function answerMbtiQuestion(
  sessionId: string,
  answer: string
): Promise<AnswerQuestionResponse> {
  return apiFetch<AnswerQuestionResponse>(`/mbti-test/${sessionId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ content: answer }),
  });
}

/**
 * MBTI 테스트 결과 조회
 */
export interface MbtiResultResponse {
  mbti: string;
  dimension_scores: Record<string, number>;
  timestamp: string;
}

export async function getMbtiResult(sessionId: string): Promise<MbtiResultResponse> {
  return apiFetch<MbtiResultResponse>(`/mbti-test/result/${sessionId}`, {
    method: 'GET',
  });
}

// ============================================
// 매칭 API
// ============================================

/**
 * 매칭 요청
 */
export interface MatchRequestData {
  user_id: string;
  mbti: string;
  level?: number;  // 매칭 범위 레벨 (1: 같은 MBTI, 2: 비슷한, 3: 넓은 범위, 4: 전체)
}

export interface MatchPartner {
  user_id: string;
  mbti: string;
}

export interface MatchRequestResponse {
  status: 'waiting' | 'already_waiting' | 'matched' | 'already_matched';
  message: string;
  my_mbti: string;
  wait_count?: number;
  roomId?: string;
  partner?: MatchPartner;
}

export async function requestMatch(data: MatchRequestData): Promise<MatchRequestResponse> {
  return apiFetch<MatchRequestResponse>('/match/request', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 매칭 취소
 */
export interface MatchCancelData {
  user_id: string;
  mbti: string;
}

export interface MatchCancelResponse {
  status: 'cancelled' | 'fail';
  message: string;
}

export async function cancelMatch(data: MatchCancelData): Promise<MatchCancelResponse> {
  return apiFetch<MatchCancelResponse>('/match/cancel', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 대기열 상태 조회
 */
export interface QueueStatusResponse {
  mbti: string;
  waiting_count: number;
}

export async function getQueueStatus(mbti: string): Promise<QueueStatusResponse> {
  return apiFetch<QueueStatusResponse>(`/match/queue/${mbti}`, {
    method: 'GET',
  });
}

// ============================================
// 채팅 API
// ============================================

/**
 * 채팅 메시지 응답
 */
export interface ChatMessageDto {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

/**
 * 채팅방 미리보기 응답
 */
export interface ChatRoomPreview {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  latest_message: ChatMessageDto | null;
  unread_count: number;
}

/**
 * 내 채팅방 목록 응답
 */
export interface MyChatRoomsResponse {
  rooms: ChatRoomPreview[];
}

/**
 * 내 채팅방 목록 조회
 */
export async function getMyChatRooms(userId: string): Promise<MyChatRoomsResponse> {
  return apiFetch<MyChatRoomsResponse>(`/chat/rooms/my?user_id=${userId}`, {
    method: 'GET',
  });
}

/**
 * 채팅 히스토리 응답
 */
export interface ChatHistoryResponse {
  messages: ChatMessageDto[];
}

/**
 * 채팅방 메시지 히스토리 조회
 */
export async function getChatHistory(roomId: string): Promise<ChatHistoryResponse> {
  return apiFetch<ChatHistoryResponse>(`/chat/${roomId}/messages`, {
    method: 'GET',
  });
}

/**
 * WebSocket URL 생성
 */
export function getChatWebSocketUrl(roomId: string): string {
  // API_BASE_URL에서 http -> ws로 변경
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
  return `${wsUrl}/ws/chat/${roomId}`;
}

/**
 * 채팅 메시지 타입
 */
export interface ChatWebSocketMessage {
  sender_id: string;
  content: string;
}

export interface ChatWebSocketResponse {
  message_id: string;
  room_id: string;
  sender_id: string;
  content: string;
}

