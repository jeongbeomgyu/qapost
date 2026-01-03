// src/api/PublicCategoryApi.ts
import { API_BASE } from "./http"; // ✅ http.ts에서 export한 API_BASE 재사용 (중복 제거)

export type PublicCategoryTree = {
  groupId: number;
  groupName: string;
  groupSortOrder: number;
  categories: { id: number; name: string; sortOrder: number }[];
};

export async function fetchPublicCategoryTree(): Promise<PublicCategoryTree[]> {
  const res = await fetch(`${API_BASE}/api/categories/tree`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`fetchPublicCategoryTree failed: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
