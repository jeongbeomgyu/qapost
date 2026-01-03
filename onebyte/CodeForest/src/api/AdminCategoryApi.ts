// src/api/AdminCategoryApi.ts
import { http } from "./http";

/**
 * ===== 백엔드 DTO (record 기반) =====
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
 * ===== 프론트 모델 =====
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
  return (tree ?? [])
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
  return http<CategoryTreeResponse[]>("/api/admin/categories/tree", { method: "GET" });
}

/**
 * ===== API: 대분류(CategoryGroup) =====
 */
export async function createGroup(req: CategoryGroupRequest): Promise<void> {
  await http<void>("/api/admin/category-groups", {
    method: "POST",
    json: { ...req, isActive: false }, // ✅ 생성 기본값 비활성 강제
  });
}

export async function updateGroup(groupId: number, req: CategoryGroupRequest): Promise<void> {
  await http<void>(`/api/admin/category-groups/${groupId}`, {
    method: "PATCH",
    json: req,
  });
}

export async function toggleGroupActive(groupId: number, req: CategoryGroupRequest): Promise<void> {
  await updateGroup(groupId, req);
}

export async function deleteGroup(groupId: number): Promise<void> {
  await http<void>(`/api/admin/category-groups/${groupId}`, {
    method: "DELETE",
  });
}

export async function reorderGroups(req: CategoryGroupReorderRequest): Promise<void> {
  await http<void>("/api/admin/category-groups/reorder", {
    method: "PATCH",
    json: req,
  });
}

/**
 * ===== API: 소분류(Category) =====
 */
export async function createCategory(req: CategoryRequest): Promise<void> {
  await http<void>("/api/admin/categories", {
    method: "POST",
    json: { ...req, isActive: false }, // ✅ 생성 기본값 비활성 강제
  });
}

export async function updateCategory(categoryId: number, req: CategoryRequest): Promise<void> {
  await http<void>(`/api/admin/categories/${categoryId}`, {
    method: "PATCH",
    json: req,
  });
}

export async function toggleCategoryActive(categoryId: number, req: CategoryRequest): Promise<void> {
  await updateCategory(categoryId, req);
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await http<void>(`/api/admin/categories/${categoryId}`, {
    method: "DELETE",
  });
}

export async function reorderCategories(req: CategoryReorderRequest): Promise<void> {
  await http<void>("/api/admin/categories/reorder", {
    method: "PATCH",
    json: req,
  });
}
