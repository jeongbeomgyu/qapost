import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { loginApi } from "../api/AuthApi"; // ✅ 경로 너 프로젝트에 맞게!

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, login } = useAuth();

  const redirectTo = useMemo(() => {
    const fromState = (location.state as any)?.from as string | undefined;
    const fromQuery = searchParams.get("redirect") ?? undefined;
    return fromState || fromQuery || "/";
  }, [location.state, searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ 이미 로그인 상태면 로그인 페이지 진입 막고 홈으로
  useEffect(() => {
    if (isLoggedIn) navigate(redirectTo, { replace: true });
  }, [isLoggedIn, navigate, redirectTo]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("이메일/비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginApi({ email, password });

      const accessToken = data.accessToken;
      if (!accessToken) {
        setError("잠시 후 다시 시도해주세요.");
        return;
      }

      // ✅ AuthContext 상태도 갱신 (UI용)
      login(accessToken);

      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      const status = err?.status;

      if (status === 401 || status === 400) {
        setError("로그인 정보가 올바르지 않습니다.");
      } else {
        setError("잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-border rounded-xl p-6 shadow-sm">
        {/* ✅ 홈으로 돌아가기 버튼 */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          ← 홈으로 돌아가기
        </button>

        <h1 className="text-xl font-semibold mb-6">로그인</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">이메일</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="example@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="비밀번호"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
