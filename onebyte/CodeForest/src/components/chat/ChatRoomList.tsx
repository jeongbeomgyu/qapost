import { useEffect, useMemo, useState } from "react";
import { Search, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { fetchChatRooms, type ChatRoomResponse } from "../../api/chatApi";
import { ChatRoomListItem } from "./ChatRoomListItem";
import { useAuth } from "../../contexts/AuthContext";

export function ChatRoomList(props: {
  onSelectRoom: (room: ChatRoomResponse) => void;
  className?: string;
}) {
  const { me } = useAuth();

  const myUserId = useMemo(() => {
    const ctxId = me?.id ?? null;
    if (ctxId != null) return ctxId;
    const raw = localStorage.getItem("userId");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [me?.id]);

  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");

  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  const load = async (kw: string) => {
    try {
      setLoading(true);
      setError(false);
      const list = await fetchChatRooms(kw);
      setRooms(list);
    } catch (e: any) {
      setError(true);
      toast.error(e?.message ?? "채팅방 목록을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(debounced);
  }, [debounced]);

  return (
    <div className={props.className}>
      {/* Search */}
      <div className="px-5 py-4 border-b border-border bg-[#fafaf8]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="게시글 제목 / 상대 닉네임 검색"
            className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {loading && <div className="p-6 text-muted-foreground">불러오는 중...</div>}

      {!loading && error && (
        <div className="p-6">
          <div className="text-muted-foreground mb-3">현황을 불러오지 못했습니다</div>
          <button
            type="button"
            onClick={() => void load(debounced)}
            className="px-4 py-2 rounded border border-border hover:bg-secondary/30"
          >
            재시도
          </button>
        </div>
      )}

      {!loading && !error && rooms.length === 0 && (
        <div className="p-10 text-center text-muted-foreground">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          채팅방이 없습니다.
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div>
          {rooms.map((room) => (
            <ChatRoomListItem
              key={room.id}
              room={room}
              myUserId={myUserId}
              onClick={() => props.onSelectRoom(room)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


