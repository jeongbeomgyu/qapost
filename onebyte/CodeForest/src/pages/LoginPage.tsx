import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:8080";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isLoggedIn, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ 이미 로그인 상태면 로그인 페이지 진입 막고 홈으로
  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ✅ 튕김(새로고침) 방지
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("이메일/비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      // 🔥 너 백엔드 로그인 엔드포인트에 맞춰 바꿔야 함
      // 예시: POST /api/auth/login  { email, password } -> { accessToken }
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // 디버깅 로그는 최소화 (필요하면 여기서만 임시로 켜면 됨)
        if (res.status === 401 || res.status === 400) {
          setError("로그인 정보가 올바르지 않습니다.");
          return;
        }
        setError("잠시 후 다시 시도해주세요.");
        return;
      }
    
      const data = await res.json();
    
      // ✅ 너가 준 응답 형태 그대로
      const accessToken = data.accessToken;
      if (!accessToken) {
        setError("잠시 후 다시 시도해주세요.");
        return;
      }
    
      login(accessToken);
      navigate("/");
    } catch (err) {
      setError("잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-border rounded-xl p-6 shadow-sm">
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
