import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { toast } from "sonner";
import { fetchPublicCategoryTree, type PublicCategoryTree } from "../api/PublicCategoryApi";
import { createBoard } from "../api/BoardApi";
import { ApiError } from "../api/AuthApi";
import { RichTextEditor } from "../components/editor/RichTextEditor";

export function WritePostPage() {
  const navigate = useNavigate();
  const [tree, setTree] = useState<PublicCategoryTree[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [mainCategoryId, setMainCategoryId] = useState<number | null>(null);
  const [subCategoryId, setSubCategoryId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string>("<p></p>");
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
    const trimmedContentText = content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (!mainCategoryId || !subCategoryId || !trimmedTitle || !trimmedContentText) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createBoard({
        title: trimmedTitle,
        content, // ✅ TipTap HTML 저장
        categoryId: subCategoryId,
      });
      toast.success("게시글이 등록되었습니다");
      if (res?.id) navigate(`/post/${res.id}`);
      else navigate("/");
    } catch (e: any) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error(e?.message ?? "게시글 등록 실패");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Full-width editor layout */}
      <div className="flex-1 w-full">
        <div className="w-full px-6 py-8">
          {/* Top bar: category + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={mainCategoryId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setMainCategoryId(v ? Number(v) : null);
                }}
                disabled={loadingCategories || !!categoriesError}
                className="h-10 px-3 border border-border rounded-lg bg-white disabled:bg-secondary/30 disabled:cursor-not-allowed"
              >
                <option value="">대카테고리</option>
                {mainCategories.map((cat) => (
                  <option key={cat.groupId} value={cat.groupId}>
                    {cat.groupName}
                  </option>
                ))}
              </select>

              <select
                value={subCategoryId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSubCategoryId(v ? Number(v) : null);
                }}
                disabled={!mainCategoryId || loadingCategories || !!categoriesError}
                className="h-10 px-3 border border-border rounded-lg bg-white disabled:bg-secondary/30 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!mainCategoryId ? "소카테고리" : "소카테고리 선택"}
                </option>
                {mainCategoryId && subCategories.length === 0 && (
                  <option value="" disabled>
                    소카테고리 없음
                  </option>
                )}
                {subCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              {loadingCategories && <span className="text-xs text-muted-foreground">카테고리 로딩중...</span>}
              {categoriesError && (
                <span className="text-xs text-red-600">
                  카테고리 로딩 실패: {categoriesError}{" "}
                  <button type="button" onClick={loadCategories} className="underline">
                    다시 시도
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
                className="h-10 px-5 border border-border rounded-lg hover:bg-secondary/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-10 px-5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="pb-4 border-b border-border mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full text-3xl font-semibold outline-none border-0 placeholder:text-muted-foreground"
            />
          </div>

          {/* Editor */}
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="내용을 입력하세요..."
          />
        </div>
      </div>
    </div>
  );
}