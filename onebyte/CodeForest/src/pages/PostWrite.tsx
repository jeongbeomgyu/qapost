import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { Editor } from "@tiptap/core";
import { useRef } from "react";

import { Header } from "../components/Header";
import { fetchPublicCategoryTree, type PublicCategoryTree } from "../api/PublicCategoryApi";
import { createBoard, fetchBoardDetail, updateBoard, type BoardDetail } from "../api/BoardApi";
import { ApiError } from "../api/AuthApi";
import { RichTextEditor } from "../components/editor/RichTextEditor";
import { useAuth } from "../contexts/AuthContext";

export function PostWritePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();
  const params = useParams<{ id?: string }>();
  const editingBoardId = useMemo(() => {
    const n = Number(params.id);
    return Number.isFinite(n) ? n : null;
  }, [params.id]);
  const isEditMode = editingBoardId != null;

  // ✅ 방어: 라우트 보호가 있어도, 컴포넌트 단에서도 비로그인 접근 차단
  useEffect(() => {
    if (isLoggedIn) return;
    const from = `${location.pathname}${location.search}`;
    navigate(`/login?redirect=${encodeURIComponent(from)}`, { replace: true, state: { from } });
  }, [isLoggedIn, location.pathname, location.search, navigate]);

  const queryCategoryId = useMemo(() => {
    const raw = searchParams.get("categoryId");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [searchParams]);

  const [groups, setGroups] = useState<PublicCategoryTree[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<number | "">("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [initialPost, setInitialPost] = useState<BoardDetail | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const skipNextResetRef = useRef(false);
  const appliedQueryPrefillRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingCategories(true);
        setCategoriesError(null);
        const data = await fetchPublicCategoryTree();
        setGroups(data ?? []);
      } catch (e: any) {
        setCategoriesError(e?.message ?? "카테고리 로딩 실패");
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!isEditMode || editingBoardId == null) return;
      try {
        setLoadingPost(true);
        const detail = await fetchBoardDetail(editingBoardId);
        setInitialPost(detail);
        setTitle(detail.title ?? "");
      } catch (e: any) {
        toast.error(e?.message ?? "게시글 불러오기 실패");
      } finally {
        setLoadingPost(false);
      }
    })();
  }, [isEditMode, editingBoardId]);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.groupId === selectedGroupId);
  }, [groups, selectedGroupId]);

  const categoryOptions = useMemo(() => {
    return (selectedGroup?.categories ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  }, [selectedGroup]);

  useEffect(() => {
    if (skipNextResetRef.current) {
      skipNextResetRef.current = false;
      return;
    }
    setSelectedCategoryId("");
  }, [selectedGroupId]);

  useEffect(() => {
    if (!isEditMode) return;
    const categoryId = initialPost?.categoryId;
    if (!categoryId || groups.length === 0) return;

    const group = groups.find((g) => (g.categories ?? []).some((c) => c.id === categoryId));
    if (!group) return;

    skipNextResetRef.current = true;
    setSelectedGroupId(group.groupId);
    setSelectedCategoryId(categoryId);
  }, [isEditMode, initialPost?.categoryId, groups]);

  useEffect(() => {
    if (isEditMode) return;
    if (appliedQueryPrefillRef.current) return;
    if (queryCategoryId == null) return;
    if (groups.length === 0) return;

    if (selectedGroupId !== "" || selectedCategoryId !== "") {
      appliedQueryPrefillRef.current = true;
      return;
    }

    const group = groups.find((g) => (g.categories ?? []).some((c) => c.id === queryCategoryId));
    if (!group) return;

    skipNextResetRef.current = true;
    setSelectedGroupId(group.groupId);
    setSelectedCategoryId(queryCategoryId);
    appliedQueryPrefillRef.current = true;
  }, [isEditMode, queryCategoryId, groups, selectedGroupId, selectedCategoryId]);

  useEffect(() => {
    if (!isEditMode) return;
    if (!editor) return;
    const html = initialPost?.content ?? null;
    if (!html) return;
    editor.commands.setContent(html, { emitUpdate: false });
  }, [isEditMode, editor, initialPost?.content]);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return toast.error("제목을 입력해주세요.");
    if (!selectedCategoryId) return toast.error("소카테고리를 선택해주세요.");
    if (!editor) return toast.error("에디터 초기화 중입니다. 잠시 후 다시 시도해주세요.");

    const html = editor.getHTML();
    const text = editor.getText().replace(/\u00a0/g, " ").trim();
    if (!text) return toast.error("내용을 입력해주세요.");

    try {
      setLoading(true);
      if (isEditMode && editingBoardId != null) {
        await updateBoard(editingBoardId, {
          title: trimmedTitle,
          content: html,
          categoryId: Number(selectedCategoryId),
        });
        toast.success("게시글 수정 완료");
        navigate(`/post/${editingBoardId}`);
      } else {
        const res = await createBoard({
          title: trimmedTitle,
          content: html,
          categoryId: Number(selectedCategoryId),
        });
        toast.success("게시글 등록 완료");
        if (res?.id) navigate(`/post/${res.id}`);
        else navigate("/");
      }
    } catch (e: any) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error(e?.message ?? "게시글 등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8">
        {/* ✅ 제목 */}
        <div className="mb-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full text-3xl font-semibold outline-none border-0 placeholder:text-muted-foreground"
          />
        </div>

        {/* ✅ 카테고리 선택 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value ? Number(e.target.value) : "")}
            disabled={loadingCategories || !!categoriesError}
            className="h-10 px-3 border border-border rounded-lg bg-white disabled:bg-secondary/30 disabled:cursor-not-allowed"
          >
            <option value="">대카테고리를 선택하세요</option>
            {groups
              .slice()
              .sort((a, b) => a.groupSortOrder - b.groupSortOrder)
              .map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.groupName}
                </option>
              ))}
          </select>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : "")}
            disabled={!selectedGroupId || loadingCategories || !!categoriesError}
            className="h-10 px-3 border border-border rounded-lg bg-white disabled:bg-secondary/30 disabled:cursor-not-allowed"
          >
            <option value="">
              {!selectedGroupId ? "대카테고리를 먼저 선택하세요" : "소카테고리를 선택하세요"}
            </option>
            {selectedGroupId &&
              categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>

        {/* 상태 텍스트 */}
        <div className="flex items-center gap-3 mb-5">
          {loadingCategories && <span className="text-xs text-muted-foreground">카테고리 로딩중...</span>}
          {loadingPost && <span className="text-xs text-muted-foreground">게시글 불러오는 중...</span>}
          {categoriesError && <span className="text-xs text-red-600">카테고리 로딩 실패: {categoriesError}</span>}
        </div>

        {/* ✅ 에디터 */}
        <div className="rounded-lg border border-border p-4 bg-white">
          <RichTextEditor placeholder="내용을 입력하세요..." onEditorReady={setEditor} />
        </div>

        {/* ✅ 등록 버튼: 하단 중앙 */}
        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="h-11 px-10 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (isEditMode ? "수정 중..." : "등록 중...") : isEditMode ? "수정" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
