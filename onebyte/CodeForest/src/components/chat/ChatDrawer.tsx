import { useEffect, useState } from "react";
import { X } from "lucide-react";

import type { ChatRoomResponse } from "../../api/chatApi";
import { ChatRoomList } from "./ChatRoomList";
import { ChatRoomPanel } from "./ChatRoomPanel";

export function ChatDrawer(props: { isOpen: boolean; onClose: () => void }) {
  const [view, setView] = useState<"list" | "room">("list");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedRoomInfo, setSelectedRoomInfo] = useState<ChatRoomResponse | null>(null);

  // close -> reset
  useEffect(() => {
    if (props.isOpen) return;
    setView("list");
    setSelectedRoomId(null);
    setSelectedRoomInfo(null);
  }, [props.isOpen]);

  if (!props.isOpen) return null;

  return (
    <>
      {/* overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={props.onClose} aria-hidden="true" />

      {/* drawer */}
      <aside className="fixed top-0 right-0 h-full w-[420px] max-w-[95vw] bg-white z-50 shadow-xl border-l border-border flex flex-col">
        {/* header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">1:1 채팅</div>
            <div className="font-medium text-foreground truncate">대화</div>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="p-2 rounded hover:bg-secondary/40 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {view === "list" ? (
          <ChatRoomList
            onSelectRoom={(room) => {
              setSelectedRoomId(room.id);
              setSelectedRoomInfo(room);
              setView("room");
            }}
            className="flex-1 overflow-auto"
          />
        ) : (
          <div className="flex-1 min-h-0">
            {selectedRoomId != null ? (
              <ChatRoomPanel
                roomId={selectedRoomId}
                roomInfo={selectedRoomInfo}
                onBack={() => {
                  setView("list");
                  setSelectedRoomId(null);
                  setSelectedRoomInfo(null);
                }}
              />
            ) : null}
          </div>
        )}
      </aside>
    </>
  );
}


