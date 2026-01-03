import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MessageCircle, ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import {
  createBoardComment,
  fetchBoardComments,
  fetchBoardDetail,
  // 아래 3개는 BoardApi.ts에 있어야 함 (없으면 만들어야 함)
  deleteBoard,
  deleteBoardComment,
  updateBoardComment,
  type BoardComment,
  type BoardDetail,
} from "../api/BoardApi";
import { createOrGetChatRoom } from "../api/chatApi";

// ✅ 너 프로젝트에 맞게 바꿔라 (useAuth에서 내 id 가져오기)
import { useAuth } from "../contexts/AuthContext";

export function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { me, role, isLoggedIn } = useAuth(); // me?.id 사용
  const myId = me?.id ?? null;
  const isAdmin = role === "ROLE_ADMIN";

  const boardId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : NaN;
  }, [id]);

  const [post, setPost] = useState<BoardDetail | null>(null);
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ 댓글 수정모드 상태
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [savingCommentId, setSavingCommentId] = useState<number | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);

  const startChat = async (receiverId: number) => {
    if (!isLoggedIn) {
      toast.error("로그인 필요");
      navigate("/login");
      return;
    }
    if (!post) return;
    try {
      const room = await createOrGetChatRoom(post.id, receiverId);
      navigate(`/chat/room/${room.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "채팅방을 열 수 없습니다.");
    }
  };

  useEffect(() => {
    (async () => {
      if (!Number.isFinite(boardId)) {
        setError("잘못된 게시글 ID 입니다.");
        setPost(null);
        setComments([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [detail, commentList] = await Promise.all([
          fetchBoardDetail(boardId),
          fetchBoardComments(boardId, 0, 50),
        ]);

        setPost(detail);
        setComments(commentList);
        setCommentInput("");
      } catch (e: any) {
        console.error("[PostDetail] load error:", e);
        setError(e?.message ?? "게시글을 불러오지 못했습니다.");
        setPost(null);
        setComments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [boardId]);

  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(post?.content ?? "");
  }, [post?.content]);

  const isMyPost = useMemo(() => {
    if (!post || myId == null) return false;
    return Number(post.userId) === Number(myId);
  }, [post, myId]);

  const canEditPost = isLoggedIn && isMyPost;
  const canDeletePost = isLoggedIn && (isMyPost || isAdmin);

  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm("게시글 삭제할래?")) return;

    try {
      await deleteBoard(post.id);
      toast.success("게시글 삭제 완료");
      navigate("/");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "게시글 삭제 실패");
    }
  };

  const handleCreateComment = async () => {
    const content = commentInput.trim();
    if (!content) return toast.error("댓글 내용을 입력해주세요.");
    if (content.length > 1000) return toast.error("댓글은 최대 1000자까지 입력할 수 있습니다.");
    if (!post) return;

    try {
      setIsSubmitting(true);
      const created = await createBoardComment(post.id, content);
      setCommentInput("");
      setComments((prev) => [created, ...prev]);
      toast.success("댓글 작성 완료");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "댓글 작성 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditComment = (c: BoardComment) => {
    setEditingCommentId(c.id);
    setEditingContent(c.content ?? "");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const saveEditComment = async (commentId: number) => {
    const content = editingContent.trim();
    if (!content) return toast.error("댓글 내용을 입력해주세요.");
    if (content.length > 1000) return toast.error("댓글은 최대 1000자까지 입력할 수 있습니다.");

    try {
      setSavingCommentId(commentId);
      const updated = await updateBoardComment(commentId, content, post?.id);

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...updated } : c))
      );

      toast.success("댓글 수정 완료");
      cancelEditComment();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "댓글 수정 실패");
      // 실패 시 edit 모드 유지
    }
    finally {
      setSavingCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("댓글 삭제할래?")) return;

    try {
      setDeletingCommentId(commentId);
      await deleteBoardComment(commentId, post?.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("댓글 삭제 완료");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "댓글 삭제 실패");
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center text-muted-foreground">불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-center">게시글을 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Link>

        <article className="w-full bg-white rounded-lg border border-border overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded">
                    {post.categoryName}
                  </span>
                </div>
                <h1 className="mb-4">{post.title}</h1>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
                  <button
                    onClick={() => startChat(post.userId)}
                    className="flex items-center gap-2 hover:text-primary transition-colors hover:underline group"
                  >
                    <span>{post.userNickname}</span>
                    <MessageSquare className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <span>•</span>
                  <span>{post.createdAt?.slice?.(0, 10) ?? "-"}</span>
                  <span>•</span>
                  <span>조회 {post.viewCount ?? 0}</span>
                </div>
              </div>

              {/* ✅ 버튼 정책:
                  - 작성자: 수정+삭제
                  - 관리자: 삭제(수정은 작성자만)
                  - 비로그인: 숨김
              */}
              {(canEditPost || canDeletePost) && (
                <div className="flex gap-2 shrink-0">
                  {canEditPost && (
                    <button
                      type="button"
                      onClick={() => navigate(`/post/${post.id}/edit`)}
                      className="px-3 py-2 rounded border border-border hover:bg-secondary/30"
                    >
                      수정
                    </button>
                  )}
                  {canDeletePost && (
                    <button
                      type="button"
                      onClick={handleDeletePost}
                      className="px-3 py-2 rounded border border-red-300 text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8 leading-relaxed">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
          </div>
        </article>

        {/* Comments */}
        <div className="mt-10 sm:mt-12">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3>댓글 {comments.length}</h3>
          </div>

          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="bg-white rounded-lg border border-border p-8 text-center text-muted-foreground">
                댓글이 없습니다.
              </div>
            ) : (
              comments.map((comment) => {
                const isMyComment = myId != null && Number(comment.userId) === Number(myId);
                const isEditing = editingCommentId === comment.id;
                const canEditComment = isLoggedIn && isMyComment;
                const canDeleteComment = isLoggedIn && (isMyComment || isAdmin);
                const isSaving = savingCommentId === comment.id;
                const isDeleting = deletingCommentId === comment.id;

                return (
                  <div key={comment.id} className="bg-white rounded-lg border border-border p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <button
                        onClick={() => startChat(comment.userId)}
                        className="flex items-center gap-2 hover:text-primary transition-colors hover:underline group"
                      >
                        <span>{comment.userNickname}</span>
                        <MessageSquare className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm">
                          {comment.createdAt?.slice?.(0, 16)?.replace("T", " ") ?? "-"}
                        </span>

                        {/* ✅ 댓글 버튼 정책:
                            - 작성자: 수정+삭제
                            - 관리자: 삭제
                            - 비로그인: 숨김
                        */}
                        {canDeleteComment && !isEditing && (
                          <div className="flex gap-2">
                            {canEditComment && (
                              <button
                                type="button"
                                onClick={() => startEditComment(comment)}
                                disabled={isDeleting}
                                className="text-sm px-2 py-1 rounded border border-border hover:bg-secondary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                수정
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={isDeleting}
                              className="text-sm px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isDeleting ? "삭제중..." : "삭제"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 내용 / 수정모드 */}
                    {!isEditing ? (
                      <div className="text-foreground whitespace-pre-wrap">{comment.content}</div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          className="w-full p-3 bg-background border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                          rows={4}
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          disabled={isSaving}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditComment}
                            disabled={isSaving}
                            className="px-3 py-2 rounded border border-border hover:bg-secondary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditComment(comment.id)}
                            disabled={isSaving}
                            className="px-3 py-2 rounded bg-primary text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isSaving ? "저장중..." : "저장"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 댓글 작성 */}
          <div className="mt-6 bg-white rounded-lg border border-border p-6">
            <textarea
              className="w-full p-4 bg-background border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={4}
              placeholder="댓글을 입력하세요..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleCreateComment}
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "작성중..." : "댓글 작성"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
