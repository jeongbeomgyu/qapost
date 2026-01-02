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
  // ✅ 이 프로젝트의 응답/필터링이 categoryId로 내려오므로, 생성도 categoryId로 매핑(= subCategoryId)
  subCategoryId: number;
};

export type CreateBoardResponse = {
  id?: number;
};

export async function createBoard(req: CreateBoardRequest): Promise<CreateBoardResponse> {
  const res = await fetch(`${API_BASE}/api/boards`, {
    method: "POST",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    // 서버가 subCategoryId 또는 categoryId 중 무엇을 받는지 환경마다 달라서 둘 다 넣어 호환
    body: JSON.stringify({
      title: req.title,
      content: req.content,
      subCategoryId: req.subCategoryId,
      categoryId: req.subCategoryId,
    }),
  });
  await assertOk(res, "createBoard");
  // 백엔드가 id만 주거나, 전체 board를 줄 수 있어서 둘 다 대응
  const data = (await res.json()) as any;
  const id = typeof data?.id === "number" ? data.id : typeof data?.boardId === "number" ? data.boardId : undefined;
  return { id };
}


