import { Header } from "../components/Header";
import { useNavigate } from "react-router-dom";
import type { ChatRoomResponse } from "../api/chatApi";
import { ChatRoomList } from "../components/chat/ChatRoomList";

export function ChatRoomsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="max-w-[1000px] mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-foreground">채팅</h2>
        </div>

        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <ChatRoomList
            onSelectRoom={(room: ChatRoomResponse) => {
              // ✅ route 페이지에서도 roomInfo를 넘기기 위한 보조 저장(없어도 동작)
              try {
                localStorage.setItem(`chatRoomInfo:${room.id}`, JSON.stringify(room));
              } catch {}
              navigate(`/chat/room/${room.id}`);
            }}
          />
        </div>
      </main>
    </div>
  );
}
