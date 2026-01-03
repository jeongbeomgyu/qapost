import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Header } from "../components/Header";
import { PostFeed } from "../components/PostFeed";
import { fetchPublicCategoryTree, type PublicCategoryTree } from "../api/PublicCategoryApi";

export function BoardsPage() {
  const [searchParams] = useSearchParams();

  const categoryId = useMemo(() => {
    const raw = searchParams.get("categoryId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const parentId = useMemo(() => {
    const raw = searchParams.get("parentId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const [tree, setTree] = useState<PublicCategoryTree[]>([]);

  useEffect(() => {
    fetchPublicCategoryTree()
      .then((data) => setTree(data ?? []))
      .catch((e) => console.error("카테고리 트리 로딩 실패:", e));
  }, []);

  const { groupName, subName, childIds } = useMemo(() => {
    // categoryId(소카) 우선
    if (categoryId != null) {
      for (const g of tree) {
        const found = g.categories?.find((c) => c.id === categoryId);
        if (found) return { groupName: g.groupName, subName: found.name, childIds: undefined as number[] | undefined };
      }
      return { groupName: undefined as string | undefined, subName: undefined as string | undefined, childIds: undefined as number[] | undefined };
    }

    // parentId(대카) 전체보기
    if (parentId != null) {
      const g = tree.find((x) => x.groupId === parentId);
      const ids = (g?.categories ?? []).map((c) => c.id).filter((id) => Number.isFinite(id));
      return { groupName: g?.groupName, subName: undefined as string | undefined, childIds: ids };
    }

    return { groupName: undefined as string | undefined, subName: undefined as string | undefined, childIds: undefined as number[] | undefined };
  }, [tree, categoryId, parentId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PostFeed
        subCategoryId={categoryId ?? undefined}
        subCategoryIds={categoryId == null ? childIds : undefined}
        mainCategoryName={groupName}
        subcategoryName={subName}
      />
    </div>
  );
}


