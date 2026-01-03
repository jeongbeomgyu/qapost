import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, MessageSquare, ChevronRight, PenLine, Eye } from "lucide-react";
import { ChatSidePanel } from "./ChatSidePanel";
import { PopularPosts } from "./PopularPosts";
import { CommunityStatsCard } from "./CommunityStatsCard";
import {
  fetchBoardsByCategory,
  fetchBoardsPage,
  type BoardListItem,
  type PageResponse,
} from "../api/BoardApi";

interface PostFeedProps {
  subCategoryId?: number; // ✅ 소카테고리 id
  mainCategoryName?: string;
  subcategoryName?: string;
}

export function PostFeed({
  subCategoryId,
  mainCategoryName,
  subcategoryName,
}: PostFeedProps = {}) {
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  const [page, setPage] = useState(0);
  const size = 20;

  const [data, setData] = useState<PageResponse<BoardListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chatUser, setChatUser] = useState<{ name: string; id: string } | null>(null);

  // ✅ 소카테고리 변경 시 페이지 리셋
  useEffect(() => {
    setPage(0);
  }, [subCategoryId]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const json =
          typeof subCategoryId === "number" && Number.isFinite(subCategoryId)
            ? await fetchBoardsByCategory(subCategoryId, page, size)
            : await fetchBoardsPage(page, size);

        setData(json as PageResponse<BoardListItem>);
      } catch (e: any) {
        setError(e?.message ?? "알 수 없는 에러");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [page, subCategoryId]);

  // ✅ 화면용 posts (필터 + 정렬)
  const posts = useMemo(() => {
    const list = data?.content ?? [];

    const filtered =
      typeof subCategoryId === "number" && Number.isFinite(subCategoryId)
        ? list.filter((p) => p.categoryId === subCategoryId)
        : list;

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "latest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.viewCount ?? 0) - (a.viewCount ?? 0);
    });

    return sorted;
  }, [data, sortBy, subCategoryId]);

  return (
    <>
      <section className="max-w-[1400px] mx-auto px-8 py-16">
        {/* ✅ 핵심: flex 대신 grid로 2컬럼 강제 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Main Feed */}
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h2>{subcategoryName || mainCategoryName || "전체 게시글"}</h2>
              </div>

              {(mainCategoryName || subcategoryName) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Link to="/" className="hover:text-primary transition-colors">
                    홈
                  </Link>
                  {mainCategoryName && (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-foreground">{mainCategoryName}</span>
                    </>
                  )}
                  {subcategoryName && (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-primary font-medium">{subcategoryName}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-6 mb-6 border-b border-border">
              <button
                onClick={() => setSortBy("latest")}
                className={`pb-3 px-1 border-b-2 transition-colors ${
                  sortBy === "latest"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                최신순
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`pb-3 px-1 border-b-2 transition-colors ${
                  sortBy === "popular"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                인기순
              </button>
            </div>

            {/* 상태 표시 */}
            {loading && (
              <div className="bg-white rounded-lg border border-border p-6 text-muted-foreground">
                불러오는 중...
              </div>
            )}
            {error && (
              <div className="bg-white rounded-lg border border-red-200 p-6 text-red-600">
                불러오기 실패: {error}
              </div>
            )}

            {/* Post List */}
            {!loading && !error && (
              <div className="bg-white rounded-lg border border-border overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[140px_1fr_90px_100px_140px_120px] gap-4 px-8 py-4 bg-[#fafaf8] border-b border-border text-muted-foreground">
                  <div className="text-center">카테고리</div>
                  <div>제목</div>
                  <div className="text-center">댓글</div>
                  <div className="text-center">조회수</div>
                  <div className="text-center">작성자</div>
                  <div className="text-center">작성일</div>
                </div>

                {/* Body */}
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="grid grid-cols-[140px_1fr_90px_100px_140px_120px] gap-4 px-8 py-6 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors group"
                  >
                    {/* category badge centered */}
                    <div className="flex items-center justify-center">
                      <span className="inline-block max-w-[200px] truncate px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm text-center">
                        {post.categoryName}
                      </span>
                    </div>

                    <Link
                      to={`/post/${post.id}`}
                      className="text-foreground group-hover:text-primary transition-colors truncate"
                      title={post.title}
                    >
                      {post.title}
                    </Link>

                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentCount ?? 0}</span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{(post.viewCount ?? 0).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setChatUser({ name: post.userNickname, id: String(post.userId) });
                        }}
                        className="group/author flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        type="button"
                      >
                        <span className="hover:underline">{post.userNickname}</span>
                        <MessageSquare className="w-4 h-4 opacity-0 group-hover/author:opacity-100 transition-opacity" />
                      </button>
                    </div>

                    <div className="text-center text-muted-foreground text-sm">
                      {post.createdAt.slice(0, 10)}
                    </div>
                  </div>
                ))}

                {posts.length === 0 && (
                  <div className="p-10 text-center text-muted-foreground">게시글이 없습니다.</div>
                )}
              </div>
            )}

            {/* 글쓰기 버튼 */}
            <div className="mt-6 flex justify-end">
              <Link
                // ✅ 카테고리 페이지(/category/:id)에서 진입했으면 해당 소카 id를 querystring으로 전달
                to={
                  typeof subCategoryId === "number" && Number.isFinite(subCategoryId)
                    ? `/post/write?categoryId=${subCategoryId}`
                    : "/post/write"
                }
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                <PenLine className="w-4 h-4" />
                글쓰기
              </Link>
            </div>

            {/* 페이지 이동 */}
            {data && data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  disabled={data.first}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  이전
                </button>
                <span className="text-sm text-muted-foreground">
                  {data.number + 1} / {data.totalPages}
                </span>
                <button
                  disabled={data.last}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            )}
          </div>

          {/* ✅ Sidebar: 오른쪽 고정 */}
          <aside className="w-full lg:w-[360px] lg:min-w-[320px] lg:shrink-0 lg:sticky lg:top-24">
            <div className="space-y-6">
              <PopularPosts
                posts={posts.map((p) => ({
                  id: p.id,
                  title: p.title,
                  categoryName: p.categoryName,
                  viewCount: p.viewCount ?? 0,
                  commentCount: p.commentCount ?? 0,
                }))}
              />
              <CommunityStatsCard />
            </div>
          </aside>
        </div>
      </section>

      {chatUser && (
        <ChatSidePanel
          userName={chatUser.name}
          userId={chatUser.id}
          onClose={() => setChatUser(null)}
        />
      )}
    </>
  );
}
