// admin/AdminCategoryApi.ts
import { toast } from "sonner";
import { clearAccessToken, withAuthHeaders } from "./AuthApi";

const API_BASE = "http://localhost:8080";

function handleAuthFailure(status: number) {
  if (status === 401) toast.error("로그인 필요");
  if (status === 403) toast.error("권한 없음");
  clearAccessToken();
  // API 레이어에서 라우터 hook을 못 쓰니 강제 이동
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
 * ===== 백엔드 DTO (네가 올려준 record 기반) =====
 */
export type CategoryResponse = {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryTreeResponse = {
  groupId: number;
  groupName: string;
  groupSortOrder: number;
  groupIsActive: boolean;
  categories: CategoryResponse[];
};

export type CategoryGroupRequest = {
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryRequest = {
  groupId: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type CategoryGroupReorderRequest = {
  orderedGroupIds: number[];
};

export type CategoryReorderRequest = {
  groupId: number;
  orderedCategoryIds: number[];
};

/**
 * ===== 프론트 모델 (너가 쓰는 AdminCategory 형태로 매핑) =====
 * 주의: AdminCategory/AdminSubCategory 타입이 mockData에 있다면 경로 맞춰서 import해도 됨.
 * 여기선 "id는 string" 기준으로 맞춰서 mapTreeToAdmin이 바로 쓰이게 함.
 */
export type AdminSubCategory = {
  id: string;
  parentId: string;
  name: string;
  order: number;
  isActive: boolean;
  children: [];
};

export type AdminCategory = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  children: AdminSubCategory[];
};

export function mapTreeToAdmin(tree: CategoryTreeResponse[]): AdminCategory[] {
  return tree
    .slice()
    .sort((a, b) => a.groupSortOrder - b.groupSortOrder)
    .map((g) => ({
      id: String(g.groupId),
      name: g.groupName,
      order: g.groupSortOrder,
      isActive: g.groupIsActive,
      children: (g.categories ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => ({
          id: String(c.id),
          parentId: String(g.groupId),
          name: c.name,
          order: c.sortOrder,
          isActive: c.isActive,
          children: [],
        })),
    }));
}

/**
 * ===== API: 트리 조회 =====
 * GET /api/admin/categories/tree
 */
export async function fetchCategoryTree(): Promise<CategoryTreeResponse[]> {
  const res = await fetch(`${API_BASE}/api/admin/categories/tree`, {
    method: "GET",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "fetchCategoryTree");
  return res.json();
}

/**
 * ===== API: 대분류(CategoryGroup) =====
 */
export async function createGroup(req: CategoryGroupRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/category-groups`, {
    method: "POST",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    // ✅ 생성 기본값: 비활성(isActive=false) 강제
    body: JSON.stringify({ ...req, isActive: false }),
  });
  await assertOk(res, "createGroup");
}

export async function updateGroup(groupId: number, req: CategoryGroupRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/category-groups/${groupId}`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(req),
  });
  await assertOk(res, "updateGroup");
}

export async function toggleGroupActive(groupId: number, req: CategoryGroupRequest): Promise<void> {
  return updateGroup(groupId, req);
}

export async function deleteGroup(groupId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/category-groups/${groupId}`, {
    method: "DELETE",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "deleteGroup");
}

export async function reorderGroups(req: CategoryGroupReorderRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/category-groups/reorder`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(req),
  });
  await assertOk(res, "reorderGroups");
}

/**
 * ===== API: 소분류(Category) =====
 */
export async function createCategory(req: CategoryRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/categories`, {
    method: "POST",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    // ✅ 생성 기본값: 비활성(isActive=false) 강제
    body: JSON.stringify({ ...req, isActive: false }),
  });
  await assertOk(res, "createCategory");
}

export async function updateCategory(categoryId: number, req: CategoryRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/categories/${categoryId}`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(req),
  });
  await assertOk(res, "updateCategory");
}

export async function toggleCategoryActive(categoryId: number, req: CategoryRequest): Promise<void> {
  return updateCategory(categoryId, req);
}

export async function deleteCategory(categoryId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/categories/${categoryId}`, {
    method: "DELETE",
    headers: withAuthHeaders(),
    credentials: "include",
  });
  await assertOk(res, "deleteCategory");
}

export async function reorderCategories(req: CategoryReorderRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/categories/reorder`, {
    method: "PATCH",
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(req),
  });
  await assertOk(res, "reorderCategories");
}
