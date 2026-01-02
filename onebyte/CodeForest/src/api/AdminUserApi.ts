import { toast } from "sonner";
import { clearAccessToken, withAuthHeaders } from "./AuthApi";

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

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: withAuthHeaders(),
    credentials: "include",
  });

  await assertOk(res, "fetchAdminUsers");

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function banAdminUser(userId: number, reason: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/ban`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  await assertOk(res, "banAdminUser");
}

export async function unbanAdminUser(userId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/users/${userId}/unban`, {
    method: "PATCH",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "unbanAdminUser");
}
