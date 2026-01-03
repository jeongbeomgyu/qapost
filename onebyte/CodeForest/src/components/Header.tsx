import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, Sparkles, MessageCircle, PenLine } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { fetchPublicCategoryTree } from "../api/PublicCategoryApi";
import { useChatDrawer } from "../contexts/ChatDrawerContext";

type SubCategory = {
  id: number;
  name: string;
  sortOrder: number;
};

type CategoryGroup = {
  groupId: number;
  groupName: string;
  groupSortOrder: number;
  categories: SubCategory[];
};

function buildRedirectQuery(pathname: string, search: string) {
  return encodeURIComponent(`${pathname}${search ?? ""}`);
}

export function Header() {
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);

  const { isLoggedIn, role, logout } = useAuth();
  const { open: openChatDrawer } = useChatDrawer();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = role === "ROLE_ADMIN";
  const isAdminPage = location.pathname.startsWith("/admin");

  const selectedSubCategoryId = useMemo(() => {
    const m = location.pathname.match(/^\/category\/(\d+)/);
    return m ? Number(m[1]) : null;
  }, [location.pathname]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await fetchPublicCategoryTree();
        if (!alive) return;
        setCategories(data ?? []);
      } catch (e) {
        console.error("헤더 카테고리 로딩 실패:", e);
        if (!alive) return;
        setCategories([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const goWrite = () => {
    if (!isLoggedIn) {
      const redirect = buildRedirectQuery("/post/write", "");
      navigate(`/login?redirect=${redirect}`);
      return;
    }
    navigate("/post/write");
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-primary mr-12 flex items-center gap-2">
          <span className="text-2xl">🌲</span>
          <span className="font-semibold">코드숲</span>
        </Link>

        {/* 카테고리 네비: "관리 페이지"에서만 숨김 */}
        {!isAdminPage && (
          <nav className="flex-1 flex items-center justify-center gap-6">
            {categories
              .slice()
              .sort((a, b) => a.groupSortOrder - b.groupSortOrder)
              .map((category) => {
                const hasSubs = (category.categories?.length ?? 0) > 0;

                return (
                  <div
                    key={category.groupId}
                    className="relative"
                    onMouseEnter={() => setHoveredCategory(category.groupId)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <button className="flex items-center gap-1 text-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-secondary/50">
                      {category.groupName}
                      {/* ✅ 소카 없어도 드롭다운이 뜨니까 화살표도 항상 표시 */}
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* ✅ hasSubs 조건 제거: hover면 드롭다운 무조건 표시 */}
                    {hoveredCategory === category.groupId && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3">
                        <div className="bg-white border border-border rounded-xl shadow-2xl overflow-hidden min-w-[300px]">
                          <div className="px-6 py-4 bg-gradient-to-r from-secondary/50 to-secondary/20 border-b border-border">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              <span className="font-medium text-foreground">
                                {category.groupName} 카테고리
                              </span>
                            </div>
                          </div>

                          <div className="p-4 grid gap-1">
                            {hasSubs ? (
                              category.categories
                                .slice()
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((sub) => (
                                  <Link
                                    key={sub.id}
                                    to={`/category/${sub.id}`}
                                    onClick={() => setHoveredCategory(null)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                                      selectedSubCategoryId === sub.id
                                        ? "bg-secondary/60 text-primary font-medium"
                                        : "hover:bg-secondary/50 text-foreground hover:text-primary"
                                    }`}
                                  >
                                    <div
                                      className={`w-2 h-2 rounded-full transition-colors ${
                                        selectedSubCategoryId === sub.id
                                          ? "bg-primary"
                                          : "bg-primary/30 group-hover:bg-primary"
                                      }`}
                                    />
                                    <span>{sub.name}</span>
                                  </Link>
                                ))
                            ) : (
                              <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                                아직 소카테고리가 없습니다.
                              </div>
                            )}
                          </div>

                          {/* ✅ 전체 게시글 보기: 항상 노출 */}
                          <div className="px-6 py-3 bg-secondary/10 border-t border-border">
                            <button
                              type="button"
                              onClick={() => {
                                setHoveredCategory(null);
                                navigate(`/boards?parentId=${category.groupId}`);
                              }}
                              className="text-sm text-primary hover:underline"
                            >
                              전체 게시글 보기 →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </nav>
        )}

        {/* Right Menu */}
        <div className="flex items-center gap-4">

          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="text-foreground hover:text-primary transition-colors"
              >
                로그인
              </Link>
              <span className="text-border">|</span>
              <Link
                to="/register"
                className="text-foreground hover:text-primary transition-colors"
              >
                회원가입
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={openChatDrawer}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>채팅</span>
              </button>

              {isAdmin && (
                <>
                  <span className="text-border">|</span>
                  <Link
                    to="/admin/categories"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    관리
                  </Link>
                </>
              )}

              <span className="text-border">|</span>

              <Link
                to="/mypage"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                마이페이지
              </Link>

              <span className="text-border">|</span>

              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
