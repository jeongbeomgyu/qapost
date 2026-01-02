const API_BASE = "http://localhost:8080";

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
  return res.json();
}
