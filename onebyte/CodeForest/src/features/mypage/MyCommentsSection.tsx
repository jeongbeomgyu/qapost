import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Search } from "lucide-react";
import { toast } from "sonner";
import { deleteMyComment, fetchMyComments, type MyComment } from "../../api/MyPageContentApi";
import { useAuth } from "../../contexts/AuthContext";

type UiComment = {
  id: number;
  boardId: number;
  title: string;
  content: string;
  createdAt: string;
};

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

function mapToUi(c: MyComment): UiComment {
  const title = c.boardTitle ?? `게시글 #${c.boardId}`;
  return {
    id: c.id,
    boardId: c.boardId,
    title,
    content: c.content,
    createdAt: formatDate(c.createdAt),
  };
}

export function MyCommentsSection() {
  const { isLoggedIn } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<UiComment[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchMyComments(0, 50);
      setComments((data ?? []).map(mapToUi));
    } catch (e: any) {
      toast.error(e?.message ?? "내 댓글 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ✅ 로그인 안 했으면 호출 금지
    if (!isLoggedIn) {
      setLoading(false);
      setComments([]);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchMyComments(0, 50);
        if (!alive) return;
        setComments((data ?? []).map(mapToUi));
      } catch (e: any) {
        toast.error(e?.message ?? "내 댓글 조회 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return comments;
    return comments.filter((c) => c.content.toLowerCase().includes(q));
  }, [comments, searchQuery]);

  const handleDelete = async (commentId: number) => {
    const ok = window.confirm("정말 삭제할까요?");
    if (!ok) return;

    try {
      setDeletingIds((prev) => new Set(prev).add(commentId));
      await deleteMyComment(commentId);
      toast.success("삭제 완료");
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e: any) {
      toast.error(e?.message ?? "삭제 실패");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
        <p className="text-muted-foreground mb-4">로그인이 필요합니다.</p>
        <Link to="/login" className="text-primary hover:underline">
          로그인 하러가기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">내 댓글</h1>
        <p className="text-muted-foreground">작성한 댓글 총 {comments.length}개</p>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="댓글 내용 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center text-muted-foreground">
          불러오는 중...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
          <p className="text-muted-foreground">댓글이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden"
            >
              <div className="px-6 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border flex items-center justify-between gap-3">
                <Link to={`/post/${c.boardId}`} className="min-w-0">
                  <h3 className="text-foreground hover:text-primary transition-colors truncate">
                    {c.title}
                  </h3>
                </Link>

                <Link
                  to={`/post/${c.boardId}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                >
                  원글 보기 →
                </Link>
              </div>

              <div className="px-6 py-4 space-y-3">
                <div className="text-foreground whitespace-pre-wrap">{c.content}</div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{c.createdAt}</span>
                  </div>

                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingIds.has(c.id)}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      deletingIds.has(c.id)
                        ? "border-red-200 text-red-300 opacity-60 cursor-not-allowed"
                        : "border-red-300 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    {deletingIds.has(c.id) ? "삭제중..." : "삭제"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
