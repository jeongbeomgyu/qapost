import type { UserLevel } from "../utils/userLevel";
import { http } from "./http";

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

  createdAt?: string | null;
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
  const data = await http<any>("/api/mypage/info", { method: "GET" });

  // ✅ 혹시 백엔드에서 count/level 누락돼도 화면 안 죽게 기본값
  return {
    ...data,
    postCount: data?.postCount ?? 0,
    commentCount: data?.commentCount ?? 0,
    level: coerceUserLevel(data?.level),
  } as MyPageInfo;
}

export async function updateMyPageInfo(body: UpdateMyPageInfoRequest): Promise<void> {
  await http<void>("/api/mypage/info", {
    method: "PATCH",
    json: body,
  });
}

export async function changeMyPassword(body: ChangePasswordRequest): Promise<void> {
  await http<void>("/api/mypage/password", {
    method: "PATCH",
    json: body,
  });
}

export async function withdrawMe(): Promise<void> {
  await http<void>("/api/mypage/withdraw", {
    method: "DELETE",
  });
}
