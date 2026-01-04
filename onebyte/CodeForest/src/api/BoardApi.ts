// src/api/BoardApi.ts
import { http, API_BASE } from "./http";

/**
 * ======================
 * Types
 * ======================
 */
export type BoardDetail = {
  id: number;
  categoryId: number;
  categoryName: string;
  title: string;
  content: string;
  userId: number;
  userNickname: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt?: string;
};

export type BoardComment = {
  id: number;
  boardId: number;
  userId: number;
  userNickname: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
};

export type BoardListItem = {
  id: number;
  categoryId: number;
  categoryName: string;
  title: string;
  content: string;
  userId: number;
  userNickname: string;
  viewCount: number;
  commentCount: number;
  createdAt: string;
};

export type PageResponse<T> = {
  content: T[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type CreateBoardRequest = {
  title: string;
  content: string;
  categoryId: number;
};

export type CreateBoardResponse = {
  id?: number;
};

export type UpdateBoardRequest = {
  title: string;
  content: string;
  categoryId: number;
};

/**
 * ======================
 * Helpers
 * ======================
 */
function buildUrl(path: string, params?: Record<string, string | number | undefined | null>) {
  const url = new URL(`${API_BASE}${path}`);
  if (!params) return url.toString();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

function normalizeCommentList(data: any): BoardComment[] {
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.items)
        ? data.items
        : [];

  return (items ?? []).map((x: any) => ({
    id: Number(x?.id ?? 0),
    boardId: Number(x?.boardId ?? x?.board_id ?? 0),
    userId: Number(x?.userId ?? x?.user_id ?? 0),
    userNickname: String(x?.userNickname ?? x?.user_nickname ?? ""),
    content: String(x?.content ?? ""),
    createdAt: String(x?.createdAt ?? x?.created_at ?? ""),
    updatedAt: x?.updatedAt ?? x?.updated_at,
  }));
}

/**
 * ======================
 * Public (no-auth) list/search
 * ======================
 */
export async function fetchBoardsPage(
  page = 0,
  size = 20,
  categoryId?: number
): Promise<PageResponse<BoardListItem>> {
  const url = buildUrl("/api/boards", {
    page,
    size,
    categoryId: typeof categoryId === "number" && Number.isFinite(categoryId) ? categoryId : undefined,
  });

  // ✅ 목록/검색이 로그인 필요 없으면 http가 토큰 없어도 그냥 요청함
  // (http.ts가 Authorization 없으면 빼도록 되어있어야 함)
  return http<PageResponse<BoardListItem>>(url.replace(API_BASE, ""), { method: "GET" });
}

export async function fetchBoardsByCategory(
  subCategoryId: number,
  page = 0,
  size = 20
): Promise<PageResponse<BoardListItem>> {
  return fetchBoardsPage(page, size, subCategoryId);
}

export async function searchBoardsInCategory(
  categoryId: number,
  keyword: string,
  type: "title" | "content" | "all" = "title",
  page = 0,
  size = 20
): Promise<PageResponse<BoardListItem>> {
  const url = buildUrl("/api/boards/search", {
    categoryId,
    keyword,
    type,
    page,
    size,
  });

  return http<PageResponse<BoardListItem>>(url.replace(API_BASE, ""), { method: "GET" });
}

/**
 * ======================
 * Auth-required (detail/comments/write)
 * ======================
 */
export async function fetchBoardDetail(boardId: number): Promise<BoardDetail> {
  return http<BoardDetail>(`/api/boards/${boardId}`, { method: "GET" });
}

export async function fetchBoardComments(
  boardId: number,
  page = 0,
  size = 20
): Promise<BoardComment[]> {
  const url = buildUrl(`/api/boards/${boardId}/comments`, { page, size });
  const data = await http<any>(url.replace(API_BASE, ""), { method: "GET" });
  return normalizeCommentList(data);
}

export async function createBoardComment(boardId: number, content: string): Promise<BoardComment> {
  const data = await http<any>(`/api/boards/${boardId}/comments`, {
    method: "POST",
    json: { content },
  });

  return {
    id: Number(data?.id ?? 0),
    boardId: Number(data?.boardId ?? boardId),
    userId: Number(data?.userId ?? 0),
    userNickname: String(data?.userNickname ?? ""),
    content: String(data?.content ?? content),
    createdAt: String(data?.createdAt ?? new Date().toISOString()),
    updatedAt: data?.updatedAt,
  };
}

export async function createBoard(req: CreateBoardRequest): Promise<CreateBoardResponse> {
  const data = await http<any>(`/api/boards`, {
    method: "POST",
    json: {
      title: req.title,
      content: req.content,
      categoryId: req.categoryId,
    },
  });

  const id =
    typeof data?.id === "number"
      ? data.id
      : typeof data?.boardId === "number"
        ? data.boardId
        : undefined;

  return { id };
}

export async function updateBoard(boardId: number, req: UpdateBoardRequest): Promise<BoardDetail> {
  return http<BoardDetail>(`/api/boards/${boardId}`, {
    method: "PATCH",
    json: {
      title: req.title,
      content: req.content,
      categoryId: req.categoryId,
    },
  });
}

export async function deleteBoard(boardId: number): Promise<void> {
  await http<void>(`/api/boards/${boardId}`, { method: "DELETE" });
}

export async function deleteBoardComment(commentId: number, boardId?: number): Promise<void> {
  // 1) /api/comments/{id}
  try {
    await http<void>(`/api/comments/${commentId}`, { method: "DELETE" });
    return;
  } catch (e: any) {
    // 404면 fallback
    if (e?.status !== 404) throw e;
  }

  if (typeof boardId === "number") {
    await http<void>(`/api/boards/${boardId}/comments/${commentId}`, { method: "DELETE" });
    return;
  }

  // boardId도 없고 404도 떴으면 그냥 실패
  throw new Error("deleteBoardComment failed: endpoint not found");
}

export async function updateBoardComment(
  commentId: number,
  content: string,
  boardId?: number
): Promise<BoardComment> {
  // 1) /api/comments/{id}
  try {
    const data = await http<any>(`/api/comments/${commentId}`, {
      method: "PATCH",
      json: { content },
    });

    return {
      id: Number(data?.id ?? commentId),
      boardId: Number(data?.boardId ?? data?.board_id ?? boardId ?? 0),
      userId: Number(data?.userId ?? data?.user_id ?? 0),
      userNickname: String(data?.userNickname ?? data?.user_nickname ?? ""),
      content: String(data?.content ?? content),
      createdAt: String(data?.createdAt ?? data?.created_at ?? new Date().toISOString()),
      updatedAt: data?.updatedAt ?? data?.updated_at,
    };
  } catch (e: any) {
    if (e?.status !== 404) throw e;
  }

  // 2) board-scope fallback
  if (typeof boardId === "number") {
    const data = await http<any>(`/api/boards/${boardId}/comments/${commentId}`, {
      method: "PATCH",
      json: { content },
    });

    return {
      id: Number(data?.id ?? commentId),
      boardId: Number(data?.boardId ?? boardId),
      userId: Number(data?.userId ?? 0),
      userNickname: String(data?.userNickname ?? ""),
      content: String(data?.content ?? content),
      createdAt: String(data?.createdAt ?? new Date().toISOString()),
      updatedAt: data?.updatedAt,
    };
  }

  throw new Error("updateBoardComment failed: endpoint not found");
}
