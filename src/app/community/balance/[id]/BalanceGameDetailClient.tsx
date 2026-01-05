'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import MBTIBadge from '@/components/community/MBTIBadge';
import CommentSection from '@/components/community/CommentSection';
import {
  getBalanceGameDetail,
  getBalanceResult,
  voteBalanceGame,
  createBalanceGameComment,
  type BalanceGameDetail,
  type BalanceResult,
  type Comment,
  type CreateCommentData,
} from '@/lib/api';

const ALL_MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

interface Props {
  gameId: string;
}

export default function BalanceGameDetailClient({ gameId }: Props) {
  const router = useRouter();
  const { isLoggedIn, user, profile, loading: authLoading } = useAuth();

  const [game, setGame] = useState<BalanceGameDetail | null>(null);
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userChoice, setUserChoice] = useState<'left' | 'right' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGame = useCallback(async () => {
    setIsLoading(true);
    try {
      const gameData = await getBalanceGameDetail(gameId, user?.id);
      setGame(gameData);

      // 이미 투표한 경우 userChoice 설정 및 결과 조회
      if (gameData.user_choice) {
        setUserChoice(gameData.user_choice);
        const resultData = await getBalanceResult(gameId);
        setResult(resultData);
      }

      // Transform comments from detail response
      const transformedComments: Comment[] = gameData.comments.map(c => ({
        id: c.id,
        game_id: gameId,
        author_id: c.author_id,
        author_mbti: c.author_mbti,
        content: c.content,
        created_at: c.created_at,
      }));
      setComments(transformedComments);
    } catch (err) {
      console.error('Failed to load balance game:', err);
      setError('밸런스 게임을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [gameId, user?.id]);

  useEffect(() => {
    void loadGame();
  }, [loadGame]);

  const handleVote = async (choice: 'left' | 'right') => {
    if (!isLoggedIn || !user?.id || !profile?.mbti) {
      router.push('/login');
      return;
    }

    if (!game || !game.is_votable) return;

    setIsVoting(true);
    setError(null);

    try {
      await voteBalanceGame(gameId, {
        user_id: user.id,
        user_mbti: profile.mbti,
        choice,
      });

      setUserChoice(choice);

      // Load results
      const resultData = await getBalanceResult(gameId);
      setResult(resultData);
    } catch (err: any) {
      const message = err?.message || '';
      if (message.includes('400')) {
        setError('이미 투표하셨습니다.');
        // Still load results
        const resultData = await getBalanceResult(gameId);
        setResult(resultData);
      } else {
        setError('투표에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleCommentSubmit = async (data: CreateCommentData) => {
    const newComment = await createBalanceGameComment(gameId, data);
    setComments((prev) => [...prev, newComment]);
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <p className="text-4xl mb-4">⚖️</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">밸런스 게임</h1>
          <p className="text-gray-500">게임을 찾을 수 없습니다.</p>
          <Link href="/community/balance" className="text-purple-500 text-sm mt-4 inline-block">
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const hasVoted = userChoice !== null || result !== null;
  const canVote = game.is_votable && !hasVoted;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <Link href="/community/balance" className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm">
        ← 목록으로
      </Link>

      {/* Game Card */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-pink-400 to-purple-400 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <span className="text-xl">⚖️</span>
              <span className="font-medium">밸런스 게임</span>
            </div>
            {game.is_votable ? (
              <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                투표 가능
              </span>
            ) : (
              <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                마감됨 (30일 경과)
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs text-gray-400 mb-2">{game.week_of}</div>
          <h2 className="text-xl font-bold text-gray-800 text-center mb-6">
            {game.question}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {canVote ? (
            // Voting Buttons
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleVote('left')}
                disabled={isVoting}
                className="p-6 bg-pink-50 hover:bg-pink-100 rounded-2xl text-center transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl block mb-2">👈</span>
                <span className="font-bold text-gray-800">{game.option_left}</span>
              </button>
              <button
                onClick={() => handleVote('right')}
                disabled={isVoting}
                className="p-6 bg-purple-50 hover:bg-purple-100 rounded-2xl text-center transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-2xl block mb-2">👉</span>
                <span className="font-bold text-gray-800">{game.option_right}</span>
              </button>
            </div>
          ) : (
            // Results View (from detail or after voting)
            <div className="space-y-6">
              {/* 내 투표 표시 */}
              {userChoice && (
                <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-xl py-2">
                  나의 선택: <span className={userChoice === 'left' ? 'text-pink-600 font-bold' : 'text-purple-600 font-bold'}>
                    {userChoice === 'left' ? game.option_left : game.option_right}
                  </span>
                </div>
              )}

              {/* Overall Result */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className={`text-pink-600 ${userChoice === 'left' ? 'font-bold' : ''}`}>
                    {game.option_left} {userChoice === 'left' && '✓'}
                  </span>
                  <span className={`text-purple-600 ${userChoice === 'right' ? 'font-bold' : ''}`}>
                    {userChoice === 'right' && '✓'} {game.option_right}
                  </span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${result?.left_percentage ?? game.left_percentage}%` }}
                  >
                    {(result?.left_percentage ?? game.left_percentage) > 15 && (
                      <span className="text-white text-sm font-bold">
                        {(result?.left_percentage ?? game.left_percentage).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div
                    className="bg-gradient-to-r from-purple-400 to-purple-500 transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${result?.right_percentage ?? game.right_percentage}%` }}
                  >
                    {(result?.right_percentage ?? game.right_percentage) > 15 && (
                      <span className="text-white text-sm font-bold">
                        {(result?.right_percentage ?? game.right_percentage).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center text-sm text-gray-500">
                  총 {result?.total_votes ?? game.total_votes}명 참여
                </div>
              </div>

              {/* MBTI Breakdown (only if voted and has result) */}
              {result && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">MBTI별 투표 현황</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_MBTI_TYPES.map((mbti) => {
                      const breakdown = result.mbti_breakdown[mbti];
                      if (!breakdown || (breakdown.left === 0 && breakdown.right === 0)) {
                        return null;
                      }
                      const total = breakdown.left + breakdown.right;
                      const leftPct = total > 0 ? (breakdown.left / total) * 100 : 50;

                      return (
                        <div key={mbti} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <MBTIBadge mbti={mbti} size="sm" />
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                              <div
                                className="bg-pink-400 transition-all duration-300"
                                style={{ width: `${leftPct}%` }}
                              />
                              <div
                                className="bg-purple-400 transition-all duration-300"
                                style={{ width: `${100 - leftPct}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!game.is_votable && !result && (
                <div className="text-center text-gray-400 text-sm py-4">
                  이 게임은 30일이 경과하여 투표가 마감되었습니다.
                </div>
              )}
            </div>
          )}

          {!isLoggedIn && canVote && (
            <p className="text-center text-gray-400 text-sm mt-4">
              로그인 후 투표에 참여할 수 있습니다
            </p>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <CommentSection
          comments={comments}
          onSubmit={handleCommentSubmit}
          isLoading={false}
        />
      </div>
    </div>
  );
}