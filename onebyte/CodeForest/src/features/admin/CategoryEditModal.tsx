import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface CategoryEditModalProps {
  isOpen: boolean;
  type: 'add-main' | 'edit-main' | 'add-sub' | 'edit-sub';
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function CategoryEditModal({
  isOpen,
  type,
  initialName = '',
  onClose,
  onSave,
}: CategoryEditModalProps) {
  const [name, setName] = useState(initialName);

  // Reset name when modal opens with new initial value
  useEffect(() => {
    setName(initialName);
  }, [initialName, isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && name.trim()) {
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, name, onClose]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
    }
  };

  const getTitle = () => {
    const isAdd = type === 'add-main' || type === 'add-sub';
    const isSub = type === 'add-sub' || type === 'edit-sub';
    
    if (isAdd) {
      return isSub ? '소카테고리 추가' : '대카테고리 추가';
    } else {
      return isSub ? '소카테고리 이름 수정' : '카테고리 이름 수정';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3>{getTitle()}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
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
          <p className="text-xs text-muted-foreground mt-2">
            Enter 키를 눌러 저장하거나 Esc 키를 눌러 취소할 수 있습니다
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/10">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-border bg-white rounded-lg hover:bg-secondary/30 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
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
