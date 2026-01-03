// src/api/MyPageContentApi.ts
import { toast } from "sonner";
import { http } from "./http";

const API_BASE = "http://localhost:8080"; // (다른 파일들이랑 통일용, 실제 호출은 http가 API_BASE 사용)

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
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  const data = await http<any>(`/api/mypage/boards?${qs.toString()}`, { method: "GET" });
  return Array.isArray(data) ? data : [];
}

export async function fetchMyComments(page = 0, size = 20): Promise<MyComment[]> {
  const qs = new URLSearchParams({ page: String(page), size: String(size) });
  const data = await http<any>(`/api/mypage/comments?${qs.toString()}`, { method: "GET" });
  return Array.isArray(data) ? data : [];
}

export async function deleteMyBoard(boardId: number): Promise<void> {
  await http<void>(`/api/boards/${boardId}`, { method: "DELETE" });
}

export async function deleteMyComment(commentId: number): Promise<void> {
  await http<void>(`/api/comments/${commentId}`, { method: "DELETE" });
}
