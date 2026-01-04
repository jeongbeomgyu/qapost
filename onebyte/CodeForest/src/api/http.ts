import { toast } from "sonner";
import { getAccessToken, saveAccessToken, clearAccessToken } from "./AuthApi";

// Vite 환경변수 사용 (빌드 시점에 주입됨)
// 배포 환경: VITE_API_URL 환경변수로 설정 (예: http://44.220.167.111:8080)
// 로컬 개발: 환경변수가 없으면 기본값 localhost:8080 사용
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

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

/**
 * ✅ 핵심: Authorization 우선순위
 * - extra(init.headers)에 Authorization이 있어도 무조건 최신 토큰으로 덮어쓴다.
 */
function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getChatAccessToken();
  if (!token) return { ...extra };
  return { ...extra, Authorization: `Bearer ${token}` };
}

/**
 * ✅ 에러 메시지 읽기: 빈 바디/텍스트/JSON 전부 대응
 */
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return `${res.status} ${res.statusText}`.trim();

    // JSON이면 message 우선
    try {
      const data = JSON.parse(text);
      if (typeof (data as any)?.message === "string") return (data as any).message;
    } catch {
      // text가 JSON이 아니면 그대로 사용
    }

    return text;
  } catch {
    return `${res.status} ${res.statusText}`.trim();
  }
}

/**
 * ✅ 로그인 페이지 리다이렉트 "한 번만" + 현재가 /login 이면 스킵
 */
let redirectingToLogin = false;

function handleAuthFailure(status: number) {
  if (status !== 401 && status !== 403) return;

  clearAccessToken();

  if (window.location.pathname === "/login") {
    if (status === 401) toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
    if (status === 403) toast.error("권한이 없습니다.");
    return;
  }

  if (redirectingToLogin) return;
  redirectingToLogin = true;

  if (status === 401) toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
  if (status === 403) toast.error("권한이 없습니다.");

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
      credentials: "include",
    });

    if (!res.ok) {
      const msg = await readErrorMessage(res);
      throw new HttpError(msg || "reissue failed", res.status);
    }

    // ✅ reissue도 body가 비어있을 가능성 대비
    const text = await res.text();
    const data = text ? (JSON.parse(text) as { accessToken?: string; token?: string }) : {};

    const newToken = normalizeToken((data as any).accessToken ?? (data as any).token ?? null);

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

  // ✅ 혹시 각 API에서 Authorization을 넣어도 무시 (항상 최신 토큰으로)
  delete (headers as any).Authorization;
  delete (headers as any).authorization;

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

  // ✅ 204는 바디 없음
  if (res.status === 204) return undefined as T;

  // ✅ 200/201인데 body 비어있으면 json 파싱하지 말고 끝내
  const text = await res.text();
  if (!text) return undefined as T;

  // ✅ JSON이면 파싱해서 반환, 아니면 text 그대로 반환
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
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
