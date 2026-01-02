import { toast } from "sonner";
import { clearAccessToken, withAuthHeaders } from "./AuthApi";
import type { UserLevel } from "../utils/userLevel";

const API_BASE = "http://localhost:8080";

function handleAuthFailure(status: number) {
  if (status === 401) toast.error("로그인 필요");
  if (status === 403) toast.error("권한 없음");
  clearAccessToken();
  window.location.assign("/login");
}

async function assertOk(res: Response, action: string) {
  if (res.status === 401 || res.status === 403) {
    handleAuthFailure(res.status);
    throw new Error(`${action} unauthorized (${res.status})`);
  }
  if (!res.ok) throw new Error(`${action} failed: ${res.status}`);
}

/**
 * ✅ 백엔드 MyPageInfoResponse에 맞춘 타입
 * - postCount/commentCount/level/role/userStatus 추가
 * - createdAt은 백엔드에서 안 내려주면 undefined로 남아도 OK
 */
export type MyPageInfo = {
  id: number;
  email: string;
  name: string;
  nickname: string;

  bio?: string | null;
  websiteUrl?: string | null;

  role: "ROLE_USER" | "ROLE_ADMIN";
  userStatus: "ACTIVE" | "WITHDRAWN_BY_USER" | "BANNED_BY_ADMIN";

  postCount: number;
  commentCount: number;
  level: UserLevel;

  createdAt?: string | null; // 백엔드에 없으면 그냥 undefined
};

function coerceUserLevel(level: unknown): UserLevel {
  const n = typeof level === "number" ? level : Number(level);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return 1;
}

export type UpdateMyPageInfoRequest = {
  name?: string;
  nickname?: string;
  bio?: string | null;
  websiteUrl?: string | null;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export async function fetchMyPageInfo(): Promise<MyPageInfo> {
  const res = await fetch(`${API_BASE}/api/mypage/info`, {
    method: "GET",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "fetchMyPageInfo");

  const data = (await res.json()) as any;

  // ✅ 혹시 백엔드에서 count/level 누락돼도 화면 안 죽게 기본값
  return {
    ...data,
    postCount: data.postCount ?? 0,
    commentCount: data.commentCount ?? 0,
    level: coerceUserLevel(data.level),
  };
}

export async function updateMyPageInfo(body: UpdateMyPageInfoRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/api/mypage/info`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(body),
  });
  await assertOk(res, "updateMyPageInfo");
}

export async function changeMyPassword(body: ChangePasswordRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/api/mypage/password`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(body),
  });
  await assertOk(res, "changeMyPassword");
}

export async function withdrawMe(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/mypage/withdraw`, {
    method: "DELETE",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "withdrawMe");
}
