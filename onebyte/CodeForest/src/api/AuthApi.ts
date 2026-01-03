const API_BASE = "http://localhost:8080";

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

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
};

/** ✅ 서버 응답에서 accessToken을 최대한 뽑아내는 함수 */
function pickAccessToken(data: LoginResponse): string | null {
  const raw = (data?.accessToken ?? data?.token ?? null) as string | null;
  if (!raw) return null;
  const v = raw.trim();
  if (!v || v === "null" || v === "undefined") return null;
  return v;
}

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

  // ✅ 여기! 로그인 성공 시 accessToken 저장
  const accessToken = pickAccessToken(data);
  if (!accessToken) {
    // 백엔드가 accessToken을 안 주면 프론트는 인증 불가능이라 에러로 처리
    throw new ApiError("login response에 accessToken이 없습니다.", 500);
  }
  saveAccessToken(accessToken);

  // ✅ 정규화: accessToken 필드로 맞춰서 반환(나머지 코드가 쓰기 편함)
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
    headers: {
      "Content-Type": "application/json",
    },
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
  const trimmed = token?.trim?.() ?? "";
  if (!trimmed) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, trimmed);

  // legacy 키 정리(있으면 제거해서 혼동 방지)
  for (const k of LEGACY_TOKEN_KEYS) localStorage.removeItem(k);
}

export function getAccessToken(): string | null {
  const normalize = (raw: string | null): string | null => {
    if (!raw) return null;
    const v = raw.trim();
    if (!v || v === "null" || v === "undefined") return null;
    return v;
  };

  // 1) primary key
  const primary = normalize(localStorage.getItem(TOKEN_STORAGE_KEY));
  if (primary) return primary;

  // 2) legacy keys (있으면 primary로 마이그레이션)
  for (const k of LEGACY_TOKEN_KEYS) {
    const legacy = normalize(localStorage.getItem(k));
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
