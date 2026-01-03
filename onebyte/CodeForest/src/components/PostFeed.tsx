import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  MessageSquare,
  ChevronRight,
  PenLine,
  Eye,
  Search,
} from "lucide-react";
import { ChatSidePanel } from "./ChatSidePanel";
import { PopularPosts } from "./PopularPosts";
import { CommunityStatsCard } from "./CommunityStatsCard";
import {
  fetchBoardsByCategory,
  fetchBoardsPage,
  searchBoardsInCategory,
  type BoardListItem,
  type PageResponse,
} from "../api/BoardApi";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

interface PostFeedProps {
  subCategoryId?: number; // ✅ 소카테고리 id
  /** ✅ 대카 전체보기 모드: 여러 소카 id를 합쳐서 보여줄 때 사용 (프론트 임시 구현) */
  subCategoryIds?: number[];
  mainCategoryName?: string;
  subcategoryName?: string;
}

export function PostFeed({
  subCategoryId,
  subCategoryIds,
  mainCategoryName,
  subcategoryName,
}: PostFeedProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  const [page, setPage] = useState(0);
  const size = 20;

  const [data, setData] = useState<PageResponse<BoardListItem> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chatUser, setChatUser] = useState<{ name: string; id: string } | null>(
    null
  );

  // ✅ 입력값 (타이핑해도 fetch 안 돌게)
  const [keyword, setKeyword] = useState("");
  // ✅ 실제 검색에 사용할 값 (검색 버튼/Enter에서만 바뀜)
  const [searchKeyword, setSearchKeyword] = useState("");
  const trimmedSearchKeyword = useMemo(
    () => searchKeyword.trim(),
    [searchKeyword]
  );

  const isParentMode = useMemo(() => {
    return Array.isArray(subCategoryIds) && subCategoryIds.length > 0;
  }, [subCategoryIds]);

  const isSubMode = useMemo(() => {
    return typeof subCategoryId === "number" && Number.isFinite(subCategoryId);
  }, [subCategoryId]);

  const canSearch = isSubMode || isParentMode;

  // ✅ 카테고리 변경 시: 페이지/검색 리셋
  useEffect(() => {
    setPage(0);
    setKeyword("");
    setSearchKeyword(""); // ✅ 검색도 완전 초기화
  }, [subCategoryId, isParentMode]);

  // ✅ 검색 실행 시 페이지 리셋
  useEffect(() => {
    setPage(0);
  }, [trimmedSearchKeyword]);

  // ✅ 대카 전체보기(프론트 임시 구현):
  // TODO(backend): parentId 전용 조회 API를 만들어서 한번에 페이징/정렬 되게 하는 게 정석
  function mergePages(pages: PageResponse<BoardListItem>[]) {
    const map = new Map<number, BoardListItem>();
    for (const p of pages) {
      for (const item of p?.content ?? []) {
        if (typeof item?.id === "number") map.set(item.id, item);
      }
    }
    const merged = Array.from(map.values());
    merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      content: merged.slice(0, size),
      empty: merged.length === 0,
      first: true,
      last: true,
      number: 0,
      numberOfElements: Math.min(size, merged.length),
      size,
      totalElements: merged.length,
      totalPages: 1,
    } as PageResponse<BoardListItem>;
  }

  // ✅ 검색 실행 함수 (버튼/Enter에서만 호출)
  const runSearch = () => {
    if (!canSearch) return;
    const t = keyword.trim();
    if (!t) {
      toast.error("검색어를 입력해주세요.");
      return;
    }
    setSearchKeyword(t);
  };

  // ✅ 검색 초기화
  const clearSearch = () => {
    setKeyword("");
    setSearchKeyword("");
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ 검색 모드 (searchKeyword가 있을 때만)
        if (trimmedSearchKeyword && canSearch) {
          if (isSubMode) {
            const json = await searchBoardsInCategory(
              subCategoryId as number,
              trimmedSearchKeyword,
              "title",
              page,
              size
            );
            setData(json as PageResponse<BoardListItem>);
            return;
          }

          if (isParentMode) {
            const ids = (subCategoryIds ?? []).filter(
              (x) => typeof x === "number" && Number.isFinite(x)
            );
            const pages = await Promise.all(
              ids.map((id) =>
                searchBoardsInCategory(id, trimmedSearchKeyword, "title", 0, size)
              )
            );
            setData(mergePages(pages));
            return;
          }
        }

        // ✅ 기본 목록 모드
        if (isSubMode) {
          const json = await fetchBoardsByCategory(
            subCategoryId as number,
            page,
            size
          );
          setData(json as PageResponse<BoardListItem>);
          return;
        }

        if (isParentMode) {
          const ids = (subCategoryIds ?? []).filter(
            (x) => typeof x === "number" && Number.isFinite(x)
          );
          const pages = await Promise.all(
            ids.map((id) => fetchBoardsByCategory(id, 0, size))
          );
          setData(mergePages(pages));
          return;
        }

        // 전체 게시글
        const json = await fetchBoardsPage(page, size);
        setData(json as PageResponse<BoardListItem>);
      } catch (e: any) {
        setError(e?.message ?? "알 수 없는 에러");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [
    page,
    subCategoryId,
    subCategoryIds,
    isParentMode,
    isSubMode,
    trimmedSearchKeyword,
    canSearch,
  ]);

  // ✅ 화면용 posts (필터 + 정렬)
  const posts = useMemo(() => {
    const list = data?.content ?? [];

    // 서버 필터가 안 먹는 경우만 대비(소카 모드에서만)
    const filtered = isSubMode ? list.filter((p) => p.categoryId === subCategoryId) : list;

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "latest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.viewCount ?? 0) - (a.viewCount ?? 0);
    });

    return sorted;
  }, [data, sortBy, subCategoryId, isSubMode]);

  // ✅ 검색바: 상단은 버튼 포함, 하단은 버튼 제거
  const SearchBar = ({
    className,
    variant,
  }: {
    className?: string;
    variant: "top" | "bottom";
  }) => {
    if (!canSearch) return null;

    const hasQuery = Boolean(searchKeyword.trim());

    return (
      <div className={className}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            placeholder="제목 키워드 검색"
            className={`w-full pl-10 ${
              variant === "top" ? "pr-28" : "pr-12"
            } py-2.5 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20`}
          />

          {/* 우측 UI */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {hasQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-xs px-2 py-1 rounded border border-border hover:bg-secondary/30"
              >
                초기화
              </button>
            )}

            {/* ✅ 상단만 검색 버튼 노출 */}
            {variant === "top" && (
              <button
                type="button"
                onClick={runSearch}
                className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
              >
                검색
              </button>
            )}
          </div>
        </div>

        {/* ✅ 검색중 표시(선택) */}
        {hasQuery && (
          <div className="mt-2 text-xs text-muted-foreground">
            현재 검색어: <span className="text-foreground">{searchKeyword}</span>
          </div>
        )}
      </div>
    );
  };

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
                      <span className="text-primary font-medium">
                        {subcategoryName}
                      </span>
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

            {/* ✅ 제목 검색 (상단: 버튼 있음) */}
            <SearchBar className="mb-6" variant="top" />

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
                          setChatUser({
                            name: post.userNickname,
                            id: String(post.userId),
                          });
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
                  <div className="p-10 text-center text-muted-foreground">
                    게시글이 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 글쓰기 버튼 */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const target =
                    typeof subCategoryId === "number" && Number.isFinite(subCategoryId)
                      ? `/post/write?categoryId=${subCategoryId}`
                      : "/post/write";

                  if (!isLoggedIn) {
                    navigate(`/login?redirect=${encodeURIComponent(target)}`, {
                      state: { from: target },
                    });
                    return;
                  }

                  navigate(target, { state: { from: `${location.pathname}${location.search}` } });
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                <PenLine className="w-4 h-4" />
                글쓰기
              </button>
            </div>

            {/* 페이지 이동 */}
            {data && data.totalPages > 1 && !isParentMode && !trimmedSearchKeyword && (
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

            {/* ✅ 제목 검색 (하단: 버튼 없음) */}
            <SearchBar className="mt-6" variant="bottom" />
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
