import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAccessToken, getAccessToken, saveAccessToken } from "../api/AuthApi"; // 너 파일명에 맞게
// ↑ 지금 너가 올린 loginApi/saveAccessToken 있는 파일 경로 맞춰

type Role = "ROLE_ADMIN" | "ROLE_USER" | null;

type Me = { id: number } | null;

type AuthState = {
  token: string | null;
  isLoggedIn: boolean;
  role: Role;
  me: Me;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function parseJwtPayload(token: string): any | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function extractRole(payload: any): Role {
  if (!payload) return null;

  // 케이스들 다 커버
  // 1) role: "ROLE_ADMIN"
  if (typeof payload.role === "string") {
    const r = payload.role.toUpperCase();
    if (r === "ROLE_ADMIN" || r === "ADMIN") return "ROLE_ADMIN";
    if (r === "ROLE_USER" || r === "USER") return "ROLE_USER";
  }

  // 2) roles: ["ROLE_ADMIN", ...]
  if (Array.isArray(payload.roles)) {
    if (payload.roles.includes("ROLE_ADMIN")) return "ROLE_ADMIN";
    if (payload.roles.includes("ROLE_USER")) return "ROLE_USER";
  }
  // 2-b) roles: "ROLE_ADMIN" (문자열로 오는 케이스)
  if (typeof payload.roles === "string") {
    const r = payload.roles.toUpperCase();
    if (r === "ROLE_ADMIN" || r === "ADMIN") return "ROLE_ADMIN";
    if (r === "ROLE_USER" || r === "USER") return "ROLE_USER";
  }

  // 3) authorities: ["ROLE_ADMIN", ...] or [{authority:"ROLE_ADMIN"}]
  if (Array.isArray(payload.authorities)) {
    const list = payload.authorities.map((a: any) => (typeof a === "string" ? a : a?.authority));
    if (list.includes("ROLE_ADMIN")) return "ROLE_ADMIN";
    if (list.includes("ROLE_USER")) return "ROLE_USER";
  }
  // 3-b) authorities: "ROLE_ADMIN" (문자열로 오는 케이스)
  if (typeof payload.authorities === "string") {
    const r = payload.authorities.toUpperCase();
    if (r.includes("ROLE_ADMIN") || r.includes("ADMIN")) return "ROLE_ADMIN";
    if (r.includes("ROLE_USER") || r.includes("USER")) return "ROLE_USER";
  }

  // 4) auth: "ROLE_ADMIN" 같은 케이스도 가끔 있음
  if (typeof payload.auth === "string") {
    if (payload.auth.includes("ROLE_ADMIN")) return "ROLE_ADMIN";
    if (payload.auth.includes("ROLE_USER")) return "ROLE_USER";
  }

  return null;
}

function extractUserId(payload: any): number | null {
  if (!payload) return null;

  const candidates = [payload.userId, payload.id, payload.memberId, payload.sub];
  for (const v of candidates) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      // sub가 email 같은 문자열인 JWT도 있어서 숫자 문자열만 허용
      if (/^\d+$/.test(v)) return Number(v);
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialToken = getAccessToken();
  const [token, setToken] = useState<string | null>(initialToken);
  const [role, setRole] = useState<Role>(() => {
    if (!initialToken) return null;
    return extractRole(parseJwtPayload(initialToken));
  });
  const [me, setMe] = useState<Me>(() => {
    if (!initialToken) return null;
    const id = extractUserId(parseJwtPayload(initialToken));
    return id != null ? { id } : null;
  });

  // ✅ 토큰이 바뀌는 즉시 role 갱신 (새로고침 없이 바로 반영)
  useEffect(() => {
    if (!token) {
      setRole(null);
      setMe(null);
      return;
    }
    const payload = parseJwtPayload(token);
    setRole(extractRole(payload));
    const id = extractUserId(payload);
    setMe(id != null ? { id } : null);
  }, [token]);

  const login = (newToken: string) => {
    saveAccessToken(newToken);
    // ✅ token/role을 같은 tick에서 같이 세팅 -> 로그인 직후 즉시 Header 반영
    setToken(newToken);
    const payload = parseJwtPayload(newToken);
    setRole(extractRole(payload));
    const id = extractUserId(payload);
    setMe(id != null ? { id } : null);
  };

  const logout = () => {
    clearAccessToken();
    setToken(null);
    setRole(null);
    setMe(null);
  };

  const value = useMemo(
    () => ({
      token,
      isLoggedIn: !!token,
      role,
      me,
      login,
      logout,
    }),
    [token, role, me]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
