import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { PostFeed } from "../components/PostFeed";
import { fetchPublicCategoryTree, type PublicCategoryTree } from "../api/PublicCategoryApi";

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const subCategoryId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : NaN;
  }, [id]);

  const [tree, setTree] = useState<PublicCategoryTree[]>([]);

  useEffect(() => {
    fetchPublicCategoryTree()
      .then((data) => setTree(data ?? []))
      .catch((e) => console.error("카테고리 트리 로딩 실패:", e));
  }, []);

  const { groupName, subName } = useMemo(() => {
    for (const g of tree) {
      const found = g.categories?.find((c) => c.id === subCategoryId);
      if (found) return { groupName: g.groupName, subName: found.name };
    }
    return { groupName: undefined as string | undefined, subName: undefined as string | undefined };
  }, [tree, subCategoryId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PostFeed
        subCategoryId={Number.isFinite(subCategoryId) ? subCategoryId : undefined}
        mainCategoryName={groupName}
        subcategoryName={subName}
      />
    </div>
  );
}
