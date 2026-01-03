import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "../components/Header";
import type { ChatRoomResponse } from "../api/chatApi";
import { ChatRoomPanel } from "../components/chat/ChatRoomPanel";

export function ChatRoomPage() {
  const navigate = useNavigate();
  const { roomId: roomIdParam } = useParams<{ roomId: string }>();

  const roomId = useMemo(() => {
    const n = Number(roomIdParam);
    return Number.isFinite(n) ? n : NaN;
  }, [roomIdParam]);

  const roomInfo = useMemo((): ChatRoomResponse | null => {
    if (!Number.isFinite(roomId)) return null;
    try {
      const raw = localStorage.getItem(`chatRoomInfo:${roomId}`);
      return raw ? (JSON.parse(raw) as ChatRoomResponse) : null;
    } catch {
      return null;
    }
  }, [roomId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="max-w-[1000px] mx-auto w-full px-6 py-10">
        <div className="bg-white rounded-lg border border-border overflow-hidden flex flex-col h-[75vh]">
          <ChatRoomPanel roomId={roomId} roomInfo={roomInfo} onBack={() => navigate("/chat")} />
        </div>
      </main>
    </div>
  );
}


