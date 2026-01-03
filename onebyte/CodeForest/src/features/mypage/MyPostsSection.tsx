import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Eye, MessageCircle, Heart, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { deleteMyBoard, fetchMyBoards, type MyBoard } from "../../api/MyPageContentApi";
import { useAuth } from "../../contexts/AuthContext";

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

export function MyPostsSection() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [posts, setPosts] = useState<MyBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    // ✅ 로그인 안 했으면 호출 금지
    if (!isLoggedIn) {
      setLoading(false);
      setPosts([]);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchMyBoards(0, 50);
        if (!alive) return;
        setPosts(data ?? []);
      } catch (e: any) {
        // http.ts가 401 처리(재발급/로그인 이동) 할 수 있으니
        // 여기선 UI만 덜 깨지게
        toast.error(e?.message ?? "내 게시글 조회 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [isLoggedIn]);

  // ✅ DB에서 실제로 오는 categoryName들로 자동 카테고리 목록 생성
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return ["all", ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return posts.filter((post) => {
      const matchesSearch = (post.title ?? "").toLowerCase().includes(q);
      const matchesCategory = selectedCategory === "all" || post.categoryName === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, selectedCategory]);

  const handleEdit = (postId: number) => {
    // ✅ 너 프로젝트 기준: 수정은 /post/write/:id 라고 했으니 여기로
    navigate(`/post/write/${postId}`);
  };

  const handleDelete = async (postId: number) => {
    const ok = window.confirm("정말 삭제할까요?");
    if (!ok) return;

    try {
      setDeletingId(postId);
      await deleteMyBoard(postId);
      toast.success("삭제 완료");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e: any) {
      toast.error(e?.message ?? "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ 로그인 안 했으면 페이지 자체를 안내로
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
      {/* Page Header */}
      <div>
        <h1 className="mb-2">내 게시글</h1>
        <p className="text-muted-foreground">작성한 게시글 총 {posts.length}개</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="게시글 제목 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-secondary/30 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "전체 카테고리" : cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
            <p className="text-muted-foreground">불러오는 중...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
            <p className="text-muted-foreground">
              {posts.length === 0 ? "작성한 게시글이 없습니다" : "검색 결과가 없습니다"}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden"
            >
              {/* 상단 라인 */}
              <div className="px-6 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-sm rounded">
                      {post.categoryName}
                    </span>

                    <Link to={`/post/${post.id}`} className="min-w-0">
                      <h3 className="text-foreground hover:text-primary transition-colors truncate">
                        {post.title}
                      </h3>
                    </Link>
                  </div>

                  <Link
                    to={`/post/${post.id}`}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  >
                    원글 보기 →
                  </Link>
                </div>
              </div>

              {/* 하단: 메타 + 액션 */}
              <div className="px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{(post.viewCount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>좋아요 0</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(post.id)}
                      className="px-4 py-1.5 text-sm text-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deletingId === post.id}
                      className="px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deletingId === post.id ? "삭제중..." : "삭제"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
