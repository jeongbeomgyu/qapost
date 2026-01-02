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

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // 백엔드가 메시지 주면 읽어보기
    let msg = `login failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {}
    throw new ApiError(msg, res.status);
  }

  return res.json();
}

export type RegisterRequest = {
  name: string;
  nickname: string;
  email: string;
  password: string;
  /** 서버에서도 confirm 검증(A안)할 때만 사용 (필요 없으면 보내지 않아도 됨) */
  passwordConfirm?: string;
};

export type RegisterResponse = {
  message?: string;
};

// ✅ 프로젝트 로그인 경로가 /api/users/login 이므로, 회원가입도 /api/users/register 로 맞춤
// (백엔드가 /api/auth/register 면 여기만 바꾸면 됨)
export async function registerApi(payload: RegisterRequest): Promise<RegisterResponse> {
  // passwordConfirm는 옵션: 백엔드가 받지 않으면 payload에서 제거하고 호출해도 OK
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

  // 백엔드가 message만 주거나 빈 바디를 줄 수도 있으니 안전하게 처리
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
