import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MessageCircle, ArrowLeft, MessageSquare } from "lucide-react";
import { useChat } from "../contexts/ChatContext";
import { toast } from "sonner";
import {
  createBoardComment,
  fetchBoardComments,
  fetchBoardDetail,
  type BoardComment,
  type BoardDetail,
} from "../api/BoardApi";

export function PostDetail() {
  const { id } = useParams();
  const { openChatWithUser } = useChat();

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

  useEffect(() => {
    (async () => {
      console.log("[PostDetail] boardId:", boardId);

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
        console.log("[PostDetail] comments raw:", commentList);
        setPost(detail);
        setComments(commentList);
        setCommentInput("");
      } catch (e: any) {
        setError(e?.message ?? "게시글을 불러오지 못했습니다.");
        setPost(null);
        setComments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [boardId]);

  const handleCreateComment = async () => {
    const content = commentInput.trim();
    if (!content) {
      toast.error("댓글 내용을 입력해주세요.");
      return;
    }
    if (content.length > 1000) {
      toast.error("댓글은 최대 1000자까지 입력할 수 있습니다.");
      return;
    }
    if (!post) return;

    try {
      setIsSubmitting(true);
      const created = await createBoardComment(post.id, content);
      console.log("[PostDetail] created comment:", created);
      setCommentInput("");
      // 최신 댓글이 위로 오게 prepend
      setComments((prev) => [created, ...prev]);
      toast.success("댓글 작성 완료");
    } catch (e: any) {
      console.error("[PostDetail] create comment error:", e);
      toast.error(e?.message ?? "댓글 작성 실패");
    } finally {
      setIsSubmitting(false);
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
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </Link>

        {/* Post Content */}
        <article className="w-full bg-white rounded-lg border border-border overflow-hidden">
          {/* Post Header */}
          <div className="p-6 sm:p-8 border-b border-border">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded">
                {post.categoryName}
              </span>
            </div>
            <h1 className="mb-6">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
              <button
                onClick={() => openChatWithUser(post.userNickname, String(post.userId), String(post.id))}
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

          {/* Post Body */}
          <div className="p-6 sm:p-8 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-10 sm:mt-12">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3>댓글 {comments.length}</h3>
          </div>

          {/* Comment List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="bg-white rounded-lg border border-border p-8 text-center text-muted-foreground">
                댓글이 없습니다.
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-lg border border-border p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <button
                      onClick={() => openChatWithUser(comment.userNickname, String(comment.userId), String(post.id))}
                      className="flex items-center gap-2 hover:text-primary transition-colors hover:underline group"
                    >
                      <span>{comment.userNickname}</span>
                      <MessageSquare className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <span className="text-muted-foreground text-sm">
                      {comment.createdAt?.slice?.(0, 16)?.replace("T", " ") ?? "-"}
                    </span>
                  </div>
                  <div className="text-foreground whitespace-pre-wrap">{comment.content}</div>
                </div>
              ))
            )}
          </div>

          {/* Comment Form */}
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