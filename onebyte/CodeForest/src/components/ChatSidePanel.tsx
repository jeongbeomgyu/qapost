import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";

type ChatSidePanelProps = {
  userName: string;
  userId: string;
  onClose: () => void;
};

export function ChatSidePanel({ userName, userId, onClose }: ChatSidePanelProps) {
  const [message, setMessage] = useState("");

  // ESC로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSend = () => {
    if (!message.trim()) return;
    console.log("send to:", userId, "msg:", message);
    setMessage("");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className="fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-xl border-l border-border flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">1:1 채팅</div>
            <div className="font-medium text-foreground truncate">{userName}</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-secondary/40 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 overflow-auto">
          <div className="text-sm text-muted-foreground">
            (임시) 채팅 UI만 띄워둔 상태야. 나중에 websocket 붙이면 여기 메시지 리스트로 바꾸면 됨.
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="메시지 입력..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              전송
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
