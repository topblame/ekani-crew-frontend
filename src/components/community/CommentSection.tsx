'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MBTIBadge from './MBTIBadge';
import type { Comment, CreateCommentData } from '@/lib/api';
import { formatRelativeTime } from '@/lib/date';

interface CommentSectionProps {
  comments: Comment[];
  onSubmit: (data: CreateCommentData) => Promise<void>;
  onUpdate?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CommentSection({
  comments,
  onSubmit,
  onUpdate,
  onDelete,
  isLoading = false,
}: CommentSectionProps) {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모드 상태
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 삭제 확인 상태
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn || !user?.id) {
      router.push('/login');
      return;
    }

    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        author_id: user.id,
        content: content.trim(),
      });
      setContent('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleUpdate = async (commentId: string) => {
    if (!onUpdate || !editContent.trim()) return;

    setIsUpdating(true);
    try {
      await onUpdate(commentId, editContent.trim());
      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(commentId);
      setDeletingCommentId(null);
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-800">댓글 {comments.length}개</h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isLoggedIn ? '댓글을 입력하세요...' : '로그인 후 댓글을 작성할 수 있습니다'}
          disabled={!isLoggedIn || isSubmitting}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          rows={3}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isLoggedIn || !content.trim() || isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-full text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '등록 중...' : '댓글 등록'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MBTIBadge mbti={comment.author_mbti} size="sm" />
                  <span className="text-xs text-gray-400">{formatRelativeTime(comment.created_at)}</span>
                </div>

                {/* 수정/삭제 버튼 (본인 댓글만) */}
                {isLoggedIn && user?.id === comment.author_id && onUpdate && onDelete && (
                  <div className="flex items-center gap-1">
                    {editingCommentId !== comment.id && deletingCommentId !== comment.id && (
                      <>
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => setDeletingCommentId(comment.id)}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-red-500 transition"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 삭제 확인 */}
              {deletingCommentId === comment.id ? (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-red-600">정말 삭제하시겠습니까?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingCommentId(null)}
                      disabled={isDeleting}
                      className="px-3 py-1 text-xs text-gray-600 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={isDeleting}
                      className="px-3 py-1 text-xs text-white bg-red-500 rounded-full hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {isDeleting ? '삭제 중...' : '삭제'}
                    </button>
                  </div>
                </div>
              ) : editingCommentId === comment.id ? (
                /* 수정 모드 */
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                      className="px-3 py-1 text-xs text-gray-600 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      disabled={isUpdating || !editContent.trim()}
                      className="px-3 py-1 text-xs text-white bg-gradient-to-r from-pink-400 to-purple-400 rounded-full hover:opacity-90 transition disabled:opacity-50"
                    >
                      {isUpdating ? '수정 중...' : '수정 완료'}
                    </button>
                  </div>
                </div>
              ) : (
                /* 일반 모드 */
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}