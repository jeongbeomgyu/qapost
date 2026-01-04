// http.ts에서 export한 API_BASE를 사용 (중복 제거)
import { API_BASE } from "./http";

// ✅ 단일 소스: 토큰 저장 키는 여기서만 관리
export const TOKEN_STORAGE_KEY = "token";

// ✅ 과거/외부 코드에서 쓰던 키(브라우저에 남아있을 수 있음)
const LEGACY_TOKEN_KEYS = ["accessToken", "ACCESS_TOKEN", "access_token"] as const;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function normalizeToken(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = String(raw).trim();
  if (!v || v === "null" || v === "undefined") return null;
  return v;
}

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string; // (보통 쿠키라 프론트에선 안 씀)
};

function pickAccessToken(data: LoginResponse): string | null {
  return normalizeToken(data?.accessToken ?? data?.token ?? null);
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // ✅ refreshToken 쿠키 받기
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `login failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {}
    throw new ApiError(msg, res.status);
  }

  const data = (await res.json()) as LoginResponse;

  const accessToken = pickAccessToken(data);
  if (!accessToken) throw new ApiError("login response에 accessToken이 없습니다.", 500);

  saveAccessToken(accessToken);

  return { ...data, accessToken };
}

export type RegisterRequest = {
  name: string;
  nickname: string;
  email: string;
  password: string;
  passwordConfirm?: string;
};

export type RegisterResponse = {
  message?: string;
};

export async function registerApi(payload: RegisterRequest): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `register failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {}
    throw new ApiError(msg, res.status);
  }

  try {
    return (await res.json()) as RegisterResponse;
  } catch {
    return {};
  }
}

export function saveAccessToken(token: string) {
  const v = normalizeToken(token);
  if (!v) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, v);

  // legacy 키 정리(있으면 제거해서 혼동 방지)
  for (const k of LEGACY_TOKEN_KEYS) localStorage.removeItem(k);
}

export function getAccessToken(): string | null {
  // 1) primary key
  const primary = normalizeToken(localStorage.getItem(TOKEN_STORAGE_KEY));
  if (primary) return primary;

  // 2) legacy keys (있으면 primary로 마이그레이션)
  for (const k of LEGACY_TOKEN_KEYS) {
    const legacy = normalizeToken(localStorage.getItem(k));
    if (legacy) {
      localStorage.setItem(TOKEN_STORAGE_KEY, legacy);
      localStorage.removeItem(k);
      return legacy;
    }
  }

  return null;
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  for (const k of LEGACY_TOKEN_KEYS) localStorage.removeItem(k);
}

export function withAuthHeaders(extra: Record<string, string> = {}) {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra };
}
