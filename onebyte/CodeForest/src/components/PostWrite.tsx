import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createBoard } from "../api/BoardApi";
import {
  fetchPublicCategoryTree,
  type PublicCategoryTree,
} from "../api/PublicCategoryApi";
import { RichTextEditor } from "./editor/RichTextEditor";

type SubOption = { id: number; name: string };
type GroupOption = { id: number; name: string; subs: SubOption[] };

export default function PostWrite() {
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string>("<p></p>");

  const [groups, setGroups] = useState<PublicCategoryTree[]>([]);

  // ✅ 드롭다운 2개
  const [groupId, setGroupId] = useState<number | "">("");
  const [subCategoryId, setSubCategoryId] = useState<number | "">("");

  const [loading, setLoading] = useState(false);

  // ✅ 카테고리 트리 로딩
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPublicCategoryTree();
        setGroups(data);
      } catch (e: any) {
        toast.error(e?.message ?? "카테고리 로딩 실패");
      }
    })();
  }, []);

  // ✅ 트리 -> 그룹 옵션
  const groupOptions: GroupOption[] = useMemo(() => {
    return (groups ?? []).map((g) => ({
      id: (g as any).groupId ?? (g as any).id ?? 0,
      name: (g as any).groupName ?? (g as any).name ?? "",
      subs: ((g as any).categories ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
      })),
    }));
  }, [groups]);

  const selectedGroup = useMemo(() => {
    if (!groupId) return null;
    return groupOptions.find((g) => g.id === groupId) ?? null;
  }, [groupId, groupOptions]);

  const subOptions = selectedGroup?.subs ?? [];

  // ✅ HTML에서 텍스트만 뽑아서 "빈 내용" 체크
  const stripHtml = (html: string) =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

  // ✅ 카테고리 페이지에서 넘어온 값 미리 선택 (state로 받는 방식)
  // navigate("/post/write", { state: { groupId, subCategoryId } })
  useEffect(() => {
    const st: any = location.state;
    if (!st) return;

    if (typeof st.groupId === "number") setGroupId(st.groupId);
    if (typeof st.subCategoryId === "number") setSubCategoryId(st.subCategoryId);
  }, [location.state]);

  // ✅ groupId 바뀌면, 소카테고리 초기화
  useEffect(() => {
    if (!groupId) {
      setSubCategoryId("");
      return;
    }
    // 현재 선택된 subCategoryId가 해당 그룹에 없으면 비움
    if (subCategoryId) {
      const ok = subOptions.some((s) => s.id === subCategoryId);
      if (!ok) setSubCategoryId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const onSubmit = async () => {
    if (!title.trim()) return toast.error("제목을 입력해");
    if (!stripHtml(content)) return toast.error("내용을 입력해");
    if (!subCategoryId) return toast.error("소카테고리를 선택해");

    try {
      setLoading(true);

      const res = await createBoard({
        title: title.trim(),
        content,
        categoryId: Number(subCategoryId),
      });

      toast.success("게시글 등록 완료");
      navigate(`/post/${res.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "게시글 등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-6 py-8 bg-white">
      <h1 className="text-2xl font-semibold mb-6">글쓰기</h1>

      {/* ✅ 제목 */}
      <div className="pb-4 border-b border-border mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full text-3xl font-semibold outline-none border-0 placeholder:text-muted-foreground"
        />
      </div>

      {/* ✅ 카테고리: 제목 밑으로 이동 */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value ? Number(e.target.value) : "")}
          className="h-10 px-3 border border-border rounded-lg bg-white min-w-[280px]"
        >
          <option value="">대카테고리를 선택하세요</option>
          {groupOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <select
          value={subCategoryId}
          onChange={(e) =>
            setSubCategoryId(e.target.value ? Number(e.target.value) : "")
          }
          className="h-10 px-3 border border-border rounded-lg bg-white min-w-[320px]"
          disabled={!groupId}
        >
          <option value="">
            {groupId ? "소카테고리를 선택하세요" : "대카테고리를 먼저 선택하세요"}
          </option>
          {subOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ 에디터 */}
      <RichTextEditor value={content} onChange={setContent} placeholder="내용을 입력하세요..." />

      {/* ✅ 등록 버튼: 내용칸 밑 */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="h-10 px-5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "등록 중..." : "등록"}
        </button>
      </div>
    </div>
  );
}
