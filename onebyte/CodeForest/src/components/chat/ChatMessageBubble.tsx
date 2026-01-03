import { useEffect, useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";
import type { ChatMessageResponse } from "../../api/chatApi";
import { toast } from "sonner";

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ChatMessageBubble(props: {
  message: ChatMessageResponse;
  isMine: boolean;
  onEdit: (messageId: number, nextContent: string) => Promise<void>;
  onDelete: (messageId: number) => Promise<void>;
}) {
  const { message, isMine } = props;

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(message.content);
  }, [message.content]);

  const isDeleted = message.isDeleted || message.content === "삭제된 메시지입니다.";
  const time = useMemo(() => formatTime(message.sendTime), [message.sendTime]);

  // ✅ 백엔드가 messageId를 안 주면 수정/삭제 불가 -> 메뉴 숨김
  const canMutate = isMine && !isDeleted && !editing && typeof message.id === "number" && message.id > 0;

  const save = async () => {
    if (typeof message.id !== "number" || message.id <= 0) {
      toast.error("이 메시지는 현재 수정할 수 없습니다(메시지 ID 없음).");
      return;
    }
    const next = draft.replace(/\u00a0/g, " ").trim();
    if (!next) {
      toast.error("내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      await props.onEdit(message.id, next);
      setEditing(false);
      setMenuOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "메시지 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraft(message.content);
    setEditing(false);
    setMenuOpen(false);
  };

  const del = async () => {
    if (typeof message.id !== "number" || message.id <= 0) {
      toast.error("이 메시지는 현재 삭제할 수 없습니다(메시지 ID 없음).");
      return;
    }
    if (!window.confirm("메시지를 삭제할까요?")) return;
    setSaving(true);
    try {
      await props.onDelete(message.id);
      setMenuOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "메시지 삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] ${isMine ? "text-right" : "text-left"}`}>
        <div className="relative inline-block">
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isMine
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-white border border-border text-foreground rounded-bl-sm shadow-sm"
            }`}
          >
            {editing && isMine && !isDeleted ? (
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-full resize-none rounded-lg px-3 py-2 text-foreground bg-white/90 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={saving}
                    className="text-xs px-2 py-1 rounded border border-border bg-white text-foreground disabled:opacity-60"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground disabled:opacity-60"
                  >
                    {saving ? "저장중..." : "저장"}
                  </button>
                </div>
              </div>
            ) : (
              <span className={isDeleted ? "text-muted-foreground italic" : ""}>{message.content}</span>
            )}
          </div>

          {/* ✅ 내 메시지 + message.id 있을 때만 메뉴 노출 */}
          {canMutate && (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="absolute -left-9 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-secondary/40 text-muted-foreground"
              aria-label="메시지 메뉴"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}

          {canMutate && menuOpen && (
            <div className="absolute right-0 mt-2 w-28 rounded-lg border border-border bg-white shadow-lg overflow-hidden z-10">
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={saving}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                수정
              </button>
              <button
                type="button"
                onClick={del}
                disabled={saving}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary/30 text-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground mt-1 px-1">{time}</div>
      </div>
    </div>
  );
}
