import { useEffect, useMemo, useRef, useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";
import { CategoryEditModal } from "./CategoryEditModal";
import {
  GripVertical,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  Save,
} from "lucide-react";
import {
  AdminCategory,
  AdminSubCategory,
  fetchCategoryTree,
  mapTreeToAdmin,
  createGroup,
  updateGroup,
  toggleGroupActive,
  deleteGroup,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
  reorderGroups,
  reorderCategories,
} from "../../api/AdminCategoryApi";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

type ConfirmModalType = {
  type: "toggle-main" | "toggle-sub" | "delete";
  item: AdminCategory | AdminSubCategory;
  categoryId?: string;
  nextIsActive?: boolean;
};

type SaveConfirmModal = { open: boolean };

type EditModalType = {
  type: "add-main" | "edit-main" | "add-sub" | "edit-sub";
  categoryId?: string;
  item?: AdminCategory | AdminSubCategory;
};

interface DraggableSubcategoryProps {
  subcategory: AdminSubCategory;
  index: number;
  categoryId: string;
  moveSubcategory: (categoryId: string, dragIndex: number, hoverIndex: number) => void;
  onEdit: (sub: AdminSubCategory, categoryId: string) => void;
  onToggleStatus: (sub: AdminSubCategory, categoryId: string) => void;
  onDelete: (sub: AdminSubCategory, categoryId: string) => void;
}

function DraggableSubcategory({
  subcategory,
  index,
  categoryId,
  moveSubcategory,
  onEdit,
  onToggleStatus,
  onDelete,
}: DraggableSubcategoryProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "subcategory",
    item: { index, categoryId },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: "subcategory",
    hover: (draggedItem: { index: number; categoryId: string }) => {
      if (draggedItem.categoryId === categoryId && draggedItem.index !== index) {
        moveSubcategory(categoryId, draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`flex items-center justify-between px-4 py-3 border border-border rounded group transition-all ${
        isDragging ? "opacity-50" : ""
      } ${subcategory.isActive ? "bg-white" : "bg-secondary/20"}`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
        <span className={`truncate ${subcategory.isActive ? "text-foreground" : "text-muted-foreground"}`}>
          {subcategory.name}
        </span>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 1) 활성/비활성 */}
        <button
          onClick={() => onToggleStatus(subcategory, categoryId)}
          className={`px-3 py-1 text-xs border rounded transition-colors ${
            subcategory.isActive
              ? "border-orange-300 text-orange-600 hover:bg-orange-50"
              : "border-primary text-primary hover:bg-primary/5"
          }`}
        >
          {subcategory.isActive ? "비활성화" : "활성화"}
        </button>

        {/* 2) 수정 */}
        <button
          onClick={() => onEdit(subcategory, categoryId)}
          className="px-3 py-1 text-xs border border-border rounded transition-colors text-foreground hover:bg-secondary/30"
          title="수정"
        >
          수정
        </button>

        {/* 3) 삭제 (비활성만) */}
        <button
          onClick={() => !subcategory.isActive && onDelete(subcategory, categoryId)}
          disabled={subcategory.isActive}
          className={`px-3 py-1 text-xs border rounded transition-colors ${
            !subcategory.isActive
              ? "border-red-300 text-red-600 hover:bg-red-50"
              : "border-red-200 text-red-300 opacity-40 cursor-not-allowed"
          }`}
          title={!subcategory.isActive ? "삭제" : "비활성 상태에서만 삭제 가능"}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

interface DraggableMainCategoryProps {
  category: AdminCategory;
  index: number;
  expanded: boolean;
  toggleExpand: (categoryId: string) => void;
  moveMainCategory: (dragIndex: number, hoverIndex: number) => void;
  moveSubcategory: (categoryId: string, dragIndex: number, hoverIndex: number) => void;

  onEditSubcategory: (sub: AdminSubCategory, categoryId: string) => void;
  onToggleSubcategoryStatus: (sub: AdminSubCategory, categoryId: string) => void;
  onDeleteItem: (item: AdminCategory | AdminSubCategory, categoryId?: string) => void;
  onAddSubcategory: (categoryId: string) => void;
}

function DraggableMainCategoryCard({
  category,
  index,
  expanded,
  toggleExpand,
  moveMainCategory,
  moveSubcategory,
  onEditSubcategory,
  onToggleSubcategoryStatus,
  onDeleteItem,
  onAddSubcategory,
}: DraggableMainCategoryProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "main-category",
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: "main-category",
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveMainCategory(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`bg-white rounded-lg border border-border shadow-sm overflow-hidden transition-all ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4 bg-secondary/20 border-b border-border">
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />

          <button
            onClick={() => toggleExpand(category.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          <h4 className="text-foreground">{category.name}</h4>

          <span
            className={`px-2 py-0.5 text-xs rounded ${
              category.isActive ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            }`}
          >
            {category.isActive ? "활성" : "비활성"}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-2">
          {category.children.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground bg-secondary/10 rounded">
              하위 카테고리가 없습니다.
            </div>
          ) : (
            category.children
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((subcategory, subIndex) => (
                <DraggableSubcategory
                  key={subcategory.id}
                  subcategory={subcategory}
                  index={subIndex}
                  categoryId={category.id}
                  moveSubcategory={moveSubcategory}
                  onEdit={onEditSubcategory}
                  onToggleStatus={onToggleSubcategoryStatus}
                  onDelete={(sub) => onDeleteItem(sub, category.id)}
                />
              ))
          )}

          <button
            onClick={() => onAddSubcategory(category.id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            세부분류 추가
          </button>
        </div>
      )}
    </div>
  );
}

export function CategoryManagementSection() {
  const { isLoggedIn, role } = useAuth();
  const isAdmin = role === "ROLE_ADMIN";
  const navigate = useNavigate();

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [confirmModal, setConfirmModal] = useState<ConfirmModalType | null>(null);
  const [saveModal, setSaveModal] = useState<SaveConfirmModal>({ open: false });
  const [editModal, setEditModal] = useState<EditModalType | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  // ==============
  // Dirty tracking
  // ==============
  const initialSnapshotRef = useRef<string>("");

  const snapshot = (data: AdminCategory[]) =>
    JSON.stringify(
      data
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((c) => ({
          id: c.id,
          name: c.name,
          order: c.order,
          isActive: c.isActive,
          children: c.children
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((s) => ({
              id: s.id,
              name: s.name,
              order: s.order,
              parentId: s.parentId,
              isActive: s.isActive,
            })),
        }))
    );

  const isDirty = useMemo(() => snapshot(categories) !== initialSnapshotRef.current, [categories]);

  // =========================
  // ✅ 권한 가드 (중요)
  // =========================
  useEffect(() => {
    if (!isLoggedIn) {
      // replace로 히스토리 더럽히지 말자
      navigate("/login", { replace: true });
      return;
    }
    if (isLoggedIn && !isAdmin) {
      toast.error("권한 없음");
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, isAdmin, navigate]);

  // =========================
  // 트리 조회 + 상태 동기화
  // =========================
  const refetchTree = async () => {
    // ✅ 가드: 권한 없으면 호출 금지
    if (!isLoggedIn || !isAdmin) return;

    const tree = await fetchCategoryTree();
    const mapped = mapTreeToAdmin(tree);

    setCategories(mapped);
    setSelectedCategoryId(mapped[0]?.id ?? null);
    setExpandedCategories(new Set(mapped.filter((c) => c.isActive).map((c) => c.id)));

    initialSnapshotRef.current = snapshot(mapped);
  };

  useEffect(() => {
    // ✅ 관리자 아닐 때는 애초에 로딩 종료
    if (!isLoggedIn || !isAdmin) {
      setLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        await refetchTree();
      } catch (e) {
        toast.error("카테고리 트리 조회 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin]);

  // =========================
  // reorder
  // =========================
  const moveMainCategory = (dragIndex: number, hoverIndex: number) => {
    setCategories((prev) => {
      const sorted = prev.slice().sort((a, b) => a.order - b.order);
      const next = [...sorted];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, removed);
      return next.map((c, idx) => ({ ...c, order: idx + 1 }));
    });
  };

  const moveSubcategory = (categoryId: string, dragIndex: number, hoverIndex: number) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        const sorted = cat.children.slice().sort((a, b) => a.order - b.order);
        const nextChildren = [...sorted];
        const [removed] = nextChildren.splice(dragIndex, 1);
        nextChildren.splice(hoverIndex, 0, removed);

        return {
          ...cat,
          children: nextChildren.map((child, idx) => ({ ...child, order: idx + 1 })),
        };
      })
    );
  };

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  // =========================
  // Toggle / Delete (서버 반영)
  // =========================
  const handleToggleMainCategoryStatus = (category: AdminCategory) => {
    if (!isAdmin) return;

    // ✅ 활성 대카테고리 최대 6개 제한
    if (!category.isActive) {
      const activeCount = categories.filter((c) => c.isActive).length;
      if (activeCount >= 6) {
        setLimitModalOpen(true);
        return;
      }
    }

    setConfirmModal({
      type: "toggle-main",
      item: category,
      nextIsActive: !category.isActive,
    });
  };

  const handleToggleSubcategoryStatus = (subcategory: AdminSubCategory, categoryId: string) => {
    if (!isAdmin) return;

    setConfirmModal({
      type: "toggle-sub",
      item: subcategory,
      categoryId,
      nextIsActive: !subcategory.isActive,
    });
  };

  const handleDeleteItem = (item: AdminCategory | AdminSubCategory, categoryId?: string) => {
    if (!isAdmin) return;
    setConfirmModal({ type: "delete", item, categoryId });
  };

  const confirmAction = async () => {
    if (!confirmModal) return;
    if (!isLoggedIn || !isAdmin) return;

    const { type, item, categoryId, nextIsActive } = confirmModal;

    try {
      if (type === "toggle-main") {
        const category = item as AdminCategory;
        const next = !!nextIsActive;

        await toggleGroupActive(Number(category.id), {
          name: category.name,
          sortOrder: category.order,
          isActive: next,
        });

        toast.success(`${category.name} ${next ? "활성화" : "비활성화"} 완료`);
        await refetchTree();
      }

      if (type === "toggle-sub") {
        const sub = item as AdminSubCategory;
        const next = !!nextIsActive;

        await toggleCategoryActive(Number(sub.id), {
          groupId: Number(categoryId ?? sub.parentId),
          name: sub.name,
          sortOrder: sub.order,
          isActive: next,
        });

        toast.success(`${sub.name} ${next ? "활성화" : "비활성화"} 완료`);
        await refetchTree();
      }

      if (type === "delete") {
        if ("parentId" in item && (item as any).parentId) {
          const sub = item as AdminSubCategory;
          if (sub.isActive) {
            toast.error("비활성 상태에서만 삭제 가능합니다.");
            return;
          }
          await deleteCategory(Number(sub.id));
          toast.success(`${sub.name} 하위 카테고리 삭제 완료`);
          await refetchTree();
        } else {
          const main = item as AdminCategory;
          if (main.isActive) {
            toast.error("비활성 상태에서만 삭제 가능합니다.");
            return;
          }
          await deleteGroup(Number(main.id));
          toast.success(`${main.name} 카테고리 삭제 완료`);
          await refetchTree();
        }
      }

      setConfirmModal(null);
    } catch (e: any) {
      toast.error(e?.message ?? "요청 실패");
    }
  };

  // =========================
  // Edit Modal (추가/수정)
  // =========================
  const handleEditModalSave = async (name: string) => {
    if (!editModal) return;
    if (!isLoggedIn || !isAdmin) return;

    const { type, categoryId, item } = editModal;

    try {
      if (type === "add-main") {
        const maxOrder = Math.max(...categories.map((c) => c.order), 0);
        await createGroup({ name, sortOrder: maxOrder + 1, isActive: false });
        toast.success(`${name} 카테고리 추가 완료`);
        await refetchTree();
      }

      if (type === "edit-main" && item) {
        const main = item as AdminCategory;
        await updateGroup(Number(main.id), {
          name,
          sortOrder: main.order,
          isActive: main.isActive,
        });
        toast.success(`카테고리명이 ${name}(으)로 변경됨`);
        await refetchTree();
      }

      if (type === "add-sub" && categoryId) {
        const parent = categories.find((c) => c.id === categoryId);
        const maxOrder = Math.max(...(parent?.children ?? []).map((s) => s.order), 0);
        await createCategory({
          groupId: Number(categoryId),
          name,
          sortOrder: maxOrder + 1,
          isActive: false,
        });
        toast.success(`${name} 하위 카테고리 추가 완료`);
        await refetchTree();
      }

      if (type === "edit-sub" && categoryId && item) {
        const sub = item as AdminSubCategory;
        await updateCategory(Number(sub.id), {
          groupId: Number(categoryId),
          name,
          sortOrder: sub.order,
          isActive: sub.isActive,
        });
        toast.success(`하위 카테고리명이 ${name}(으)로 변경됨`);
        await refetchTree();
      }

      setEditModal(null);
    } catch (e: any) {
      toast.error(e?.message ?? "요청 실패");
    }
  };

  // =========================
  // Save (reorder 저장만)
  // =========================
  const openSaveConfirm = () => {
    if (!isDirty) {
      toast.message("저장할 변경사항이 없습니다.");
      return;
    }
    setSaveModal({ open: true });
  };

  const doSave = async () => {
    if (!isLoggedIn || !isAdmin) return;

    try {
      const orderedGroupIds = categories
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((g) => Number(g.id));

      await reorderGroups({ orderedGroupIds });

      for (const g of categories) {
        const groupId = Number(g.id);
        const orderedCategoryIds = g.children
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((c) => Number(c.id));

        if (orderedCategoryIds.length > 0) {
          await reorderCategories({ groupId, orderedCategoryIds });
        }
      }

      toast.success("정렬 저장 완료");
      await refetchTree();
      setSaveModal({ open: false });
    } catch (e) {
      toast.error("저장 실패");
    }
  };

  // =========================
  // View data
  // =========================
  const isDelete = confirmModal?.type === "delete";
  const willActivate =
    confirmModal?.type === "toggle-main" || confirmModal?.type === "toggle-sub"
      ? !!confirmModal?.nextIsActive
      : false;

  const activeCategories = categories
    .filter((c) => c.isActive)
    .slice()
    .sort((a, b) => a.order - b.order);

  // ✅ 로딩
  if (loading) {
    return <div className="p-6 text-muted-foreground">카테고리 불러오는 중...</div>;
  }

  // ✅ 로그인/권한 안내 UI (가드용)
  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
        <p className="text-muted-foreground mb-4">로그인이 필요합니다.</p>
        <Link to="/login" className="text-primary hover:underline">
          로그인 하러가기 →
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
        <p className="text-muted-foreground">권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex gap-6 h-full">
        {/* Left Panel */}
        <div className="w-[320px] flex flex-col">
          <div className="mb-6">
            <h3 className="mb-4">대카테고리</h3>
            <p className="text-sm text-muted-foreground mb-4">대분류 카테고리는 최대 6개까지 선택 가능합니다.</p>

            <button
              onClick={() => setEditModal({ type: "add-main" })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              대카테고리 추가
            </button>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto">
            {categories
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((category) => (
                <div
                  key={category.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCategoryId(category.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedCategoryId(category.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-all text-left ${
                    selectedCategoryId === category.id
                      ? "bg-primary/5 border-primary"
                      : category.isActive
                        ? "bg-white border-border hover:bg-secondary/30"
                        : "bg-white border-border"
                  } ${!category.isActive ? "bg-secondary/30 opacity-70" : ""}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`flex-1 truncate ${!category.isActive ? "text-muted-foreground" : "text-foreground"}`}>
                      {category.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMainCategoryStatus(category);
                      }}
                      className={`px-2.5 py-1 text-xs border rounded transition-colors ${
                        category.isActive
                          ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                          : "border-primary text-primary hover:bg-primary/5"
                      }`}
                      title={category.isActive ? "비활성화" : "활성화"}
                    >
                      {category.isActive ? "비활성화" : "활성화"}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditModal({ type: "edit-main", item: category });
                      }}
                      className="p-1.5 rounded transition-colors hover:bg-secondary"
                      title="수정"
                    >
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (category.isActive) return;
                        handleDeleteItem(category);
                      }}
                      disabled={category.isActive}
                      className={`p-1.5 rounded transition-colors ${
                        !category.isActive ? "hover:bg-red-50" : "opacity-40 cursor-not-allowed"
                      }`}
                      title={!category.isActive ? "삭제" : "비활성 상태에서만 삭제 가능"}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="mb-2">카테고리 상세 관리</h3>
              <p className="text-sm text-muted-foreground">
                활성 카테고리만 표시됩니다. 대/소 카테고리를 드래그로 순서 변경하세요.
              </p>
            </div>

            <button
              onClick={openSaveConfirm}
              disabled={!isDirty}
              className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border transition-colors ${
                isDirty
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  : "bg-white text-muted-foreground border-border opacity-60 cursor-not-allowed"
              }`}
              title={isDirty ? "변경 순서 저장" : "변경사항 없음"}
            >
              <Save className="w-4 h-4" />
              변경 순서 저장
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {activeCategories.length === 0 ? (
              <div className="flex items-center justify-center h-64 bg-secondary/20 rounded-lg border-2 border-dashed border-border">
                <p className="text-muted-foreground">활성화된 카테고리가 없습니다.</p>
              </div>
            ) : (
              activeCategories.map((category, idx) => (
                <DraggableMainCategoryCard
                  key={category.id}
                  category={category}
                  index={idx}
                  expanded={expandedCategories.has(category.id)}
                  toggleExpand={toggleExpand}
                  moveMainCategory={moveMainCategory}
                  moveSubcategory={moveSubcategory}
                  onEditSubcategory={(sub, catId) =>
                    setEditModal({ type: "edit-sub", categoryId: catId, item: sub })
                  }
                  onToggleSubcategoryStatus={handleToggleSubcategoryStatus}
                  onDeleteItem={handleDeleteItem}
                  onAddSubcategory={(catId) => setEditModal({ type: "add-sub", categoryId: catId })}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Toggle/Delete Modal */}
      {confirmModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setConfirmModal(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3>{isDelete ? "삭제 확인" : willActivate ? "활성화 확인" : "비활성화 확인"}</h3>
              <button onClick={() => setConfirmModal(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6">
              <div
                className={`p-4 rounded-lg border ${
                  isDelete ? "bg-red-50 border-red-200" : "bg-primary/5 border-primary/20"
                }`}
              >
                <p className={isDelete ? "text-red-800" : "text-foreground"}>
                  <span className="font-medium">{confirmModal.item.name}</span>{" "}
                  {("parentId" in confirmModal.item && (confirmModal.item as any).parentId)
                    ? "하위 카테고리를"
                    : "카테고리를"}{" "}
                  {isDelete ? "삭제할까요?" : willActivate ? "활성화할까요?" : "비활성화할까요?"}
                </p>

                {isDelete && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-red-600">삭제 후 복구가 불가능합니다.</p>
                    {"parentId" in confirmModal.item ? (
                      <p className="text-xs text-red-600">
                        이 소카테고리에 속한 게시글/댓글도 모두 삭제됩니다.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/10">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-5 py-2.5 border border-border bg-white rounded-lg hover:bg-secondary/30 transition-colors"
              >
                취소
              </button>

              <button
                onClick={confirmAction}
                className={`px-5 py-2.5 rounded-lg transition-colors ${
                  isDelete
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : willActivate
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                }`}
              >
                {isDelete ? "삭제" : willActivate ? "활성화" : "비활성화"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 활성 6개 제한 모달 */}
      {limitModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setLimitModalOpen(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3>안내</h3>
              <button onClick={() => setLimitModalOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6">
              <div className="p-4 rounded-lg border bg-secondary/10 border-border">
                <p className="text-foreground">활성 대카테고리는 최대 6개까지 가능합니다.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/10">
              <button
                onClick={() => setLimitModalOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </>
      )}

      {/* Save Modal */}
      {saveModal.open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSaveModal({ open: false })} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3>변경사항 저장</h3>
              <button onClick={() => setSaveModal({ open: false })} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6">
              <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                <p className="text-foreground">변경사항을 저장하시겠습니까?</p>
                <p className="text-xs text-muted-foreground mt-2">
                  저장하면 사용자 화면(헤더/카테고리 목록)에 반영됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/10">
              <button
                onClick={() => setSaveModal({ open: false })}
                className="px-5 py-2.5 border border-border bg-white rounded-lg hover:bg-secondary/30 transition-colors"
              >
                취소
              </button>

              <button
                onClick={doSave}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      <CategoryEditModal
        isOpen={!!editModal}
        type={editModal?.type || "add-main"}
        initialName={editModal?.item?.name}
        onClose={() => setEditModal(null)}
        onSave={handleEditModalSave}
      />
    </DndProvider>
  );
}
