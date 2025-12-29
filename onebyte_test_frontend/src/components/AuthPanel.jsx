import { useEffect, useState } from "react";
import client from "../api/client";
import JsonView from "./JsonView";

const REGISTER_URL = "/users/register";
const LOGIN_URL = "/users/login";
const LOGOUT_URL = "/users/logout"; // baseURL="/api"면 최종 /api/users/logout

function extractToken(data) {
  const t =
    data?.token ??
    data?.accessToken ??
    data?.data?.token ??
    data?.data?.accessToken ??
    data?.result?.token ??
    data?.result?.accessToken;

  if (!t) return null;

  // "Bearer xxx" 로 내려주는 경우도 방어
  return typeof t === "string" ? t.replace(/^Bearer\s+/i, "") : null;
}

function normalizeAxiosError(e) {
  return {
    message: e?.message,
    status: e?.response?.status,
    statusText: e?.response?.statusText,
    data: e?.response?.data,
    // config는 순환참조가 생길 수 있어서 필요한 필드만 추려서 보여줌
    request: {
      method: e?.config?.method,
      url: e?.config?.url,
      baseURL: e?.config?.baseURL,
      params: e?.config?.params,
    },
  };
}

export default function AuthPanel() {
  const [login, setLogin] = useState({ email: "", password: "" });
  const [register, setRegister] = useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [tokenDraft, setTokenDraft] = useState(() => localStorage.getItem("token") || "");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // token이 변경되면 draft도 동기화(원하면 수정 가능)
    setTokenDraft(token);
  }, [token]);

  const saveToken = (nextToken) => {
    const v = (nextToken || "").trim();
    if (!v) return;
    localStorage.setItem("token", v);
    setToken(v);
  };

  const onLogout = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
  
    try {
      const res = await client.post(LOGOUT_URL); // ✅ 서버 로그아웃 호출
      localStorage.removeItem("token");          // ✅ 프론트 토큰도 삭제
      setToken("");                              // token 상태도 비워주기(네 코드에 token state 있잖아)
      setResult(res.data);
    } catch (e) {
      setError(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  };

  const onSaveToken = () => {
    setError(null);
    setResult(null);
    saveToken(tokenDraft);
    setResult({ message: "토큰 저장 완료", tokenPreview: (tokenDraft || "").slice(0, 25) + "..." });
  };

  const onRegister = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await client.post(REGISTER_URL, register);
      setResult(res.data);
    } catch (e) {
      setError(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await client.post(LOGIN_URL, login);
      const data = res.data;

      const token = extractToken(data);
      if (!token) {
        setResult(data);
        throw new Error("로그인 응답에서 token을 못 찾음 (응답 구조 확인 필요)");
      }

      saveToken(token);
      setResult(data);
    } catch (e) {
      setError(normalizeAxiosError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Auth</h2>

      <div style={{ marginBottom: 10, padding: 10, background: "#f8f8f8", borderRadius: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Token status</div>
        <div style={{ fontSize: 13 }}>
          {token ? (
            <>
              <div>✅ token 있음</div>
              <div style={{ marginTop: 4, wordBreak: "break-all" }}>
                preview: {token.slice(0, 25)}...
              </div>
            </>
          ) : (
            <div>❌ token 없음</div>
          )}
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8, maxWidth: 720 }}>
          <input
            style={{ width: "100%", padding: 8 }}
            placeholder="token (localStorage: token)"
            value={tokenDraft}
            onChange={(e) => setTokenDraft(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onSaveToken} disabled={loading || !tokenDraft.trim()}>
              Save token
            </button>
            <button onClick={onLogout} disabled={!token || loading}>
                {loading ? "..." : `POST ${LOGOUT_URL}`}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Login */}
        <div style={{ minWidth: 320, flex: 1 }}>
          <h3>Login</h3>
          <input
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
            placeholder="email"
            value={login.email}
            onChange={(e) => setLogin((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
            placeholder="password"
            type="password"
            value={login.password}
            onChange={(e) => setLogin((p) => ({ ...p, password: e.target.value }))}
          />
          <button onClick={onLogin} disabled={loading}>
            {loading ? "..." : `POST ${LOGIN_URL}`}
          </button>
        </div>

        {/* Register */}
        <div style={{ minWidth: 320, flex: 1 }}>
          <h3>Register</h3>

          <input
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
            placeholder="name"
            value={register.name}
            onChange={(e) => setRegister((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
            placeholder="nickname"
            value={register.nickname}
            onChange={(e) => setRegister((p) => ({ ...p, nickname: e.target.value }))}
          />
          <input
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
            placeholder="email"
            value={register.email}
            onChange={(e) => setRegister((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
            placeholder="password"
            type="password"
            value={register.password}
            onChange={(e) => setRegister((p) => ({ ...p, password: e.target.value }))}
          />

          <button onClick={onRegister} disabled={loading}>
            {loading ? "..." : `POST ${REGISTER_URL}`}
          </button>
        </div>
      </div>

      <JsonView title="Result" data={result} />
      <JsonView title="Error" data={error} />
    </div>
  );
}
