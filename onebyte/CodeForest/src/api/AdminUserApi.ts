// src/api/AdminUserApi.ts
import { http } from "./http";

// ✅ DB 상태 그대로
export type AdminUserStatus = "ACTIVE" | "WITHDRAWN_BY_USER" | "BANNED_BY_ADMIN";

// ✅ 탭/필터용 (엔드포인트 선택)
export type AdminUserStatusParam = "ALL" | "ACTIVE" | "BANNED" | "WITHDRAWN";

export type AdminUser = {
  id: number;
  email: string;
  nickname: string;
  status: AdminUserStatus;
  createdAt?: string;
};

function endpointByStatus(status: AdminUserStatusParam) {
  switch (status) {
    case "ACTIVE":
      return "/api/admin/users/active";
    case "BANNED":
      return "/api/admin/users/banned";
    case "WITHDRAWN":
      return "/api/admin/users/withdrawn";
    case "ALL":
    default:
      return "/api/admin/users";
  }
}

export async function fetchAdminUsers(
  status: AdminUserStatusParam = "ALL"
): Promise<AdminUser[]> {
  const endpoint = endpointByStatus(status);
  const data = await http<AdminUser[]>(endpoint, { method: "GET" });
  return Array.isArray(data) ? data : [];
}

export async function banAdminUser(userId: number, reason: string): Promise<void> {
  await http<void>(`/api/admin/users/${userId}/ban`, {
    method: "PATCH",
    json: { reason },
  });
}

export async function unbanAdminUser(userId: number): Promise<void> {
  await http<void>(`/api/admin/users/${userId}/unban`, {
    method: "PATCH",
  });
}
