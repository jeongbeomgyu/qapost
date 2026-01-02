import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, FileText, MessageSquare } from "lucide-react";
import { Header } from "../components/Header";
import { UserLevelBadge } from "../components/UserLevelBadge";
import { fetchMyPageInfo, type MyPageInfo } from "../api/MyPageApi";
import { toast } from "sonner";

interface MyPageLayoutProps {
  children: ReactNode;
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function getInitial(nickname?: string, email?: string) {
  const base = (nickname?.trim() || email?.trim() || "?");
  return base[0]?.toUpperCase() ?? "?";
}

export function MyPageLayout({ children }: MyPageLayoutProps) {
  const location = useLocation();

  const [me, setMe] = useState<MyPageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { path: "/mypage/profile", label: "회원정보", icon: User },
    { path: "/mypage/posts", label: "내 게시글", icon: FileText },
    { path: "/mypage/comments", label: "내 댓글", icon: MessageSquare },
  ];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchMyPageInfo();
        setMe(data);
      } catch (e: any) {
        toast.error(e?.message ?? "마이페이지 정보 로딩 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const nickname = me?.nickname ?? "";
  const email = me?.email ?? "";
  const joined = formatDate(me?.createdAt ?? null);
  const initial = useMemo(() => getInitial(nickname, email), [nickname, email]);

  // API에 없으면 기본값 처리
  const postCount = me?.postCount ?? 0;
  const commentCount = me?.commentCount ?? 0;
  const level = me?.level ?? 1;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-border">
          <div className="p-6">
            {/* Profile Summary Card */}
            <div className="mb-6 pb-6 border-b border-border">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 border-2 border-primary/20">
                  {loading ? (
                    <User className="w-8 h-8 text-primary" />
                  ) : (
                    <span className="text-xl font-semibold text-primary">
                      {initial}
                    </span>
                  )}
                </div>

                <h4 className="mb-1">{loading ? "불러오는 중..." : nickname || "-"}</h4>
                <p className="text-xs text-muted-foreground">{loading ? "" : email}</p>

                {/* 레벨 */}
                <div className="mt-3">
                  <UserLevelBadge level={level} />
                </div>

                <div className="w-full pt-3 mt-4 border-t border-border/50">
                  <div className="flex justify-around text-center">
                    <div>
                      <div className="font-medium text-primary">{postCount}</div>
                      <div className="text-xs text-muted-foreground mt-1">게시글</div>
                    </div>

                    <div className="w-px bg-border" />

                    <div>
                      <div className="font-medium text-primary">{commentCount}</div>
                      <div className="text-xs text-muted-foreground mt-1">댓글</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav>
              <div className="mb-3 text-xs text-muted-foreground">마이페이지</div>

              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                        isActive
                          ? "bg-secondary text-primary"
                          : "text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-background p-8">{children}</main>
      </div>
    </div>
  );
}
