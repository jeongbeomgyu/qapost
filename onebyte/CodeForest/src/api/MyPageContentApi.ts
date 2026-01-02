// src/api/MyPageContentApi.ts
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

export type MyBoard = {
  id: number;
  categoryId: number;
  categoryName: string;
  title: string;
  content?: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
};

export type MyComment = {
    id: number;
    boardId: number;
    boardTitle: string; // ✅ 추가
    userId: number;
    userNickname: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  };
  

export async function fetchMyBoards(page = 0, size = 20): Promise<MyBoard[]> {
  const url = new URL(`${API_BASE}/api/mypage/boards`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "fetchMyBoards");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchMyComments(page = 0, size = 20): Promise<MyComment[]> {
  const url = new URL(`${API_BASE}/api/mypage/comments`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "fetchMyComments");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function deleteMyBoard(boardId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/boards/${boardId}`, {
    method: "DELETE",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "deleteMyBoard");
}

export async function deleteMyComment(commentId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
    method: "DELETE",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "deleteMyComment");
}
