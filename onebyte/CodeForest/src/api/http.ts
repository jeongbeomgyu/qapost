import { toast } from "sonner";
import { getAccessToken, saveAccessToken, clearAccessToken } from "./AuthApi";

export const API_BASE = "http://localhost:8080";

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function normalizeToken(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v || v === "null" || v === "undefined") return null;
  return v;
}

/**
 * ✅ 토큰은 AuthApi 단일 소스만 믿는다.
 * - getAccessToken()이 legacy 마이그레이션까지 처리함
 */
export function getChatAccessToken(): string | null {
  return normalizeToken(getAccessToken());
}

function setChatAccessToken(token: string) {
  saveAccessToken(token);
}

function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getChatAccessToken();
  return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra };
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return data.message;
  } catch {
    // ignore
  }
  return `${res.status} ${res.statusText}`.trim();
}

/**
 * ✅ 로그인 페이지 리다이렉트 "한 번만" + 현재가 /login 이면 스킵
 */
let redirectingToLogin = false;

function handleAuthFailure(status: number) {
  // 401/403만 처리
  if (status !== 401 && status !== 403) return;

  // ✅ 토큰 정리(만료 토큰 남아있으면 계속 401 터짐)
  clearAccessToken();

  // ✅ 이미 로그인 페이지면 여기서 끝 (무한 리다이렉트 방지)
  if (window.location.pathname === "/login") {
    // toast는 너무 시끄러우면 빼도 됨
    if (status === 401) toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
    if (status === 403) toast.error("권한이 없습니다.");
    return;
  }

  // ✅ 여러 요청이 동시에 401 나도 login 이동은 딱 1번만
  if (redirectingToLogin) return;
  redirectingToLogin = true;

  if (status === 401) toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
  if (status === 403) toast.error("권한이 없습니다.");

  // ✅ 원래 가려던 경로 기억해서 login 후 복귀
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?redirect=${next}`);
}

/**
 * =========================
 * ✅ Refresh(재발급) 중복 방지
 * =========================
 */
let refreshPromise: Promise<string> | null = null;

async function reissueAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch(`${API_BASE}/api/users/reissue`, {
      method: "POST",
      credentials: "include", // ✅ refreshToken 쿠키 필요
    });

    if (!res.ok) {
      const msg = await readErrorMessage(res);
      throw new HttpError(msg || "reissue failed", res.status);
    }

    const data = (await res.json()) as { accessToken?: string; token?: string };
    const newToken = normalizeToken(data.accessToken ?? data.token ?? null);

    if (!newToken) {
      throw new HttpError("reissue 응답에 accessToken 없음", 500);
    }

    setChatAccessToken(newToken);
    return newToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * =========================
 * ✅ 내부 fetch 실행 함수 (재시도용)
 * =========================
 */
async function doFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
  retryOnce: boolean
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.json !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: authHeaders(headers),
    credentials: "include",
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  // ✅ access 만료(401)면: 1회만 reissue 후 재시도
  if (res.status === 401 && retryOnce) {
    try {
      await reissueAccessToken();
      return doFetch<T>(path, init, false);
    } catch (e) {
      // ✅ reissue 실패(=refresh 만료/없음) → 로그인으로 1번만 보냄
      handleAuthFailure(401);
      throw e;
    }
  }

  // 401/403은 여기서 최종 처리
  if (res.status === 401 || res.status === 403) {
    handleAuthFailure(res.status);
    throw new HttpError("unauthorized", res.status);
  }

  if (!res.ok) {
    const msg = await readErrorMessage(res);
    throw new HttpError(msg, res.status);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

/**
 * =========================
 * ✅ 외부에서 쓰는 함수
 * =========================
 */
export async function http<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  return doFetch<T>(path, init, true);
}
