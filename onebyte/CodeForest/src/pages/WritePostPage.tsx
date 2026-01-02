import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { toast } from "sonner";
import { fetchPublicCategoryTree, type PublicCategoryTree } from "../api/PublicCategoryApi";
import { createBoard } from "../api/BoardApi";

export function WritePostPage() {
  const navigate = useNavigate();
  const [tree, setTree] = useState<PublicCategoryTree[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [mainCategoryId, setMainCategoryId] = useState<number | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      setCategoriesError(null);
      const data = await fetchPublicCategoryTree();
      setTree(data ?? []);
    } catch (e: any) {
      setCategoriesError(e?.message ?? "카테고리 로딩 실패");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mainCategories = useMemo(() => {
    return [...tree].sort((a, b) => a.groupSortOrder - b.groupSortOrder);
  }, [tree]);

  const subCategories = useMemo(() => {
    const group = mainCategories.find((g) => g.groupId === mainCategoryId);
    return (group?.categories ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }, [mainCategories, mainCategoryId]);

  // ✅ 대카 변경 시: 소카 초기화
  useEffect(() => {
    setSubCategoryId(null);
  }, [mainCategoryId]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!mainCategoryId || !subCategoryId || !trimmedTitle || !trimmedContent) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createBoard({
        title: trimmedTitle,
        content: trimmedContent,
        subCategoryId,
      });
      toast.success("게시글이 등록되었습니다");
      if (res?.id) navigate(`/post/${res.id}`);
      else navigate("/");
    } catch (e: any) {
      toast.error(e?.message ?? "게시글 등록 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 max-w-[1200px] mx-auto px-8 py-16 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2">게시글 작성</h1>
          <p className="text-muted-foreground">
            커뮤니티에 새로운 게시글을 작성해보세요
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-border shadow-sm p-8 space-y-6">
          {/* Category Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                대카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={mainCategoryId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setMainCategoryId(v ? Number(v) : null);
                }}
                disabled={loadingCategories || !!categoriesError}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white disabled:bg-secondary/30 disabled:cursor-not-allowed"
              >
                <option value="">카테고리를 선택하세요</option>
                {mainCategories.map((cat) => (
                  <option key={cat.groupId} value={cat.groupId}>
                    {cat.groupName}
                  </option>
                ))}
              </select>
              {loadingCategories && (
                <div className="mt-2 text-xs text-muted-foreground">대카테고리 불러오는 중...</div>
              )}
              {categoriesError && (
                <div className="mt-2 text-xs text-red-600">
                  카테고리 로딩 실패: {categoriesError}{" "}
                  <button type="button" onClick={loadCategories} className="underline">
                    다시 시도
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                소카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                value={subCategoryId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSubCategoryId(v ? Number(v) : null);
                }}
                disabled={!mainCategoryId || loadingCategories || !!categoriesError}
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white disabled:bg-secondary/30 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!mainCategoryId ? "대카테고리를 먼저 선택하세요" : "소카테고리를 선택하세요"}
                </option>
                {mainCategoryId && subCategories.length === 0 && (
                  <option value="" disabled>
                    소카테고리가 없습니다
                  </option>
                )}
                {subCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="게시글 내용을 입력하세요"
              rows={15}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 border border-border bg-white rounded-lg hover:bg-secondary/30 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}