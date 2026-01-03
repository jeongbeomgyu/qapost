import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface CategoryEditModalProps {
  isOpen: boolean;
  type: "add-main" | "edit-main" | "add-sub" | "edit-sub";
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function CategoryEditModal({
  isOpen,
  type,
  initialName = "",
  onClose,
  onSave,
}: CategoryEditModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
  }, [initialName, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Enter") {
        const v = name.trim();
        if (!v) return;
        onSave(v);
        setName("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, name, onClose, onSave]);

  const handleSaveClick = () => {
    const v = name.trim();
    if (!v) return;
    onSave(v);
    setName("");
  };

  const getTitle = () => {
    const isAdd = type === "add-main" || type === "add-sub";
    const isSub = type === "add-sub" || type === "edit-sub";

    if (isAdd) return isSub ? "소카테고리 추가" : "대카테고리 추가";
    return isSub ? "소카테고리 이름 수정" : "카테고리 이름 수정";
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3>{getTitle()}</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            카테고리 이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="새 카테고리 이름을 입력하세요"
            autoFocus
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground mt-2">Enter 저장 / Esc 취소</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-border bg-white rounded-lg hover:bg-secondary/30 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!name.trim()}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            저장
          </button>
        </div>
      </div>
    </>
  );
}
