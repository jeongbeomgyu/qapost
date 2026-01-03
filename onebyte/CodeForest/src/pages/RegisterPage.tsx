import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiError, registerApi } from "../api/AuthApi";
import { useAuth } from "../contexts/AuthContext";

function isValidEmail(email: string) {
  // 간단 검증(요구사항: @ 포함 수준이면 충분)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  // ✅ 이미 로그인 상태면 회원가입 페이지 진입 막고 홈으로
  useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  const canSubmit = useMemo(() => {
    const n = name.trim();
    const nn = nickname.trim();
    const em = email.trim();
    const pw = password.trim();
    const pwc = passwordConfirm.trim();
    const pwOk = pw.length >= 8 && pw.length <= 64;
    const matchOk = !!pwc && pw === pwc;
    return !!n && !!nn && !!em && isValidEmail(em) && pwOk && matchOk;
  }, [name, nickname, email, password, passwordConfirm]);

  const passwordMismatch = useMemo(() => {
    const pw = password.trim();
    const pwc = passwordConfirm.trim();
    if (!pw || !pwc) return false;
    return pw !== pwc;
  }, [password, passwordConfirm]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const n = name.trim();
    const nn = nickname.trim();
    const em = email.trim();
    const pw = password.trim();
    const pwc = passwordConfirm.trim();

    if (!n || !nn || !em || !pw || !pwc) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }
    if (!isValidEmail(em)) {
      toast.error("이메일 형식이 올바르지 않습니다.");
      return;
    }
    if (pw.length < 8 || pw.length > 64) {
      toast.error("비밀번호는 8~64자로 입력해주세요.");
      return;
    }
    if (pw !== pwc) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);
      await registerApi({ name: n, nickname: nn, email: em, password: pw, passwordConfirm: pwc });
      toast.success("회원가입이 완료되었습니다. 로그인 해주세요.");
      navigate("/login");
    } catch (err: any) {
      if (err instanceof ApiError) {
        toast.error(err.message);
        return;
      }
      toast.error(err?.message ?? "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
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

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">회원가입</h1>
          <Link to="/login" className="text-sm text-primary hover:underline">
            로그인으로
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="이름"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">닉네임</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="닉네임"
              autoComplete="nickname"
            />
          </div>

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
            <label className="block text-sm text-muted-foreground mb-1">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-20 px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="비밀번호(8~64자)"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs border border-border rounded hover:bg-secondary/30"
              >
                {showPassword ? "숨기기" : "보기"}
              </button>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              비밀번호는 8~64자 (정책이 있으면 서버 기준으로 적용)
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswordConfirm ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full pr-20 px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="비밀번호 확인"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs border border-border rounded hover:bg-secondary/30"
              >
                {showPasswordConfirm ? "숨기기" : "보기"}
              </button>
            </div>
            {passwordMismatch && <div className="mt-1 text-xs text-red-600">비밀번호가 일치하지 않습니다.</div>}
          </div>

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "회원가입 중..." : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
}
