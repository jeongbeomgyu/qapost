import { toast } from "sonner";
import { ApiError, clearAccessToken, withAuthHeaders } from "./AuthApi";

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
  if (!res.ok) {
    let msg = `${action} failed: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {
      // ignore
    }
    throw new ApiError(msg, res.status);
  }
}

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

export async function fetchBoardsPage(
  page = 0,
  size = 20,
  categoryId?: number
): Promise<PageResponse<BoardListItem>> {
  const url = new URL(`${API_BASE}/api/boards`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));
  if (typeof categoryId === "number" && Number.isFinite(categoryId)) {
    url.searchParams.set("categoryId", String(categoryId));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`fetchBoardsPage failed: ${res.status}`);
  }

  return res.json();
}

export async function fetchBoardsByCategory(
  subCategoryId: number,
  page = 0,
  size = 20
): Promise<PageResponse<BoardListItem>> {
  return fetchBoardsPage(page, size, subCategoryId);
}

export async function fetchBoardDetail(boardId: number): Promise<BoardDetail> {
  const res = await fetch(`${API_BASE}/api/boards/${boardId}`, {
    method: "GET",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
  });
  await assertOk(res, "fetchBoardDetail");
  return res.json();
}

export async function fetchBoardComments(
  boardId: number,
  page = 0,
  size = 20
): Promise<BoardComment[]> {
  const url = new URL(`${API_BASE}/api/boards/${boardId}/comments`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
  });
  await assertOk(res, "fetchBoardComments");

  const data = await res.json();
  // 백엔드가 배열을 주거나, Page 형태({ content: [...] })를 줄 수 있어서 둘 다 대응
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.content)
      ? data.content
      : Array.isArray(data?.items)
        ? data.items
        : [];
  return items;
}

export async function createBoardComment(boardId: number, content: string): Promise<BoardComment> {
  const res = await fetch(`${API_BASE}/api/boards/${boardId}/comments`, {
    method: "POST",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  await assertOk(res, "createBoardComment");
  const data = (await res.json()) as any;
  // boardId가 string으로 내려와도 UI에서 number로 통일
  return {
    ...data,
    boardId: typeof data?.boardId === "number" ? data.boardId : Number(data?.boardId ?? boardId),
  } as BoardComment;
}

export type CreateBoardRequest = {
  title: string;
  content: string;
  // ✅ 백엔드 DTO(BoardRequest)의 categoryId에 맞춰서만 보낸다
  categoryId: number;
};

export type CreateBoardResponse = {
  id?: number;
};

export async function createBoard(req: CreateBoardRequest): Promise<CreateBoardResponse> {
  const res = await fetch(`${API_BASE}/api/boards`, {
    method: "POST",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({
      title: req.title,
      content: req.content,
      categoryId: req.categoryId,
    }),
  });
  await assertOk(res, "createBoard");
  // 백엔드가 id만 주거나, 전체 board를 줄 수 있어서 둘 다 대응
  const data = (await res.json()) as any;
  const id = typeof data?.id === "number" ? data.id : typeof data?.boardId === "number" ? data.boardId : undefined;
  return { id };
}

export type UpdateBoardRequest = {
  title: string;
  content: string;
  categoryId: number;
};

export async function updateBoard(boardId: number, req: UpdateBoardRequest): Promise<BoardDetail> {
  const res = await fetch(`${API_BASE}/api/boards/${boardId}`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({
      title: req.title,
      content: req.content,
      categoryId: req.categoryId,
    }),
  });
  await assertOk(res, "updateBoard");
  return res.json();
}

// =======================
// ✅ 게시글/댓글 수정·삭제 API (복붙)
// =======================

export async function deleteBoard(boardId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/boards/${boardId}`, {
      method: "DELETE",
      headers: withAuthHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
    });
    await assertOk(res, "deleteBoard");
    // 백엔드가 body를 안 줄 수도 있어서 그냥 종료
  }
  
export async function deleteBoardComment(commentId: number, boardId?: number): Promise<void> {
  // 1) 우선 /api/comments/{id} 시도 (mypage에서도 이 패턴을 사용중)
  let res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
    method: "DELETE",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
  });
  // 2) 백엔드가 board-scope 구조면 fallback
  if (res.status === 404 && typeof boardId === "number") {
    res = await fetch(`${API_BASE}/api/boards/${boardId}/comments/${commentId}`, {
      method: "DELETE",
      headers: withAuthHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
    });
  }
  await assertOk(res, "deleteBoardComment");
}

export async function updateBoardComment(
  commentId: number,
  content: string,
  boardId?: number
): Promise<BoardComment> {
  // 1) 우선 /api/comments/{id} PATCH
  let res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  // 2) board-scope fallback
  if (res.status === 404 && typeof boardId === "number") {
    res = await fetch(`${API_BASE}/api/boards/${boardId}/comments/${commentId}`, {
      method: "PATCH",
      headers: withAuthHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify({ content }),
    });
  }

  await assertOk(res, "updateBoardComment");
  const data = (await res.json()) as any;

  // 응답 형태가 제각각이어도 UI가 안정적으로 돌아가게 normalize
  return {
    id: Number(data?.id ?? commentId),
    boardId: Number(data?.boardId ?? data?.board_id ?? boardId ?? 0),
    userId: Number(data?.userId ?? data?.user_id ?? 0),
    userNickname: String(data?.userNickname ?? data?.user_nickname ?? ""),
    content: String(data?.content ?? content),
    createdAt: String(data?.createdAt ?? data?.created_at ?? new Date().toISOString()),
    updatedAt: data?.updatedAt ?? data?.updated_at,
  } as BoardComment;
}
  
