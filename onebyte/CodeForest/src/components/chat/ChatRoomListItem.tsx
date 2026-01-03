import { useMemo } from "react";
import type { ChatRoomResponse } from "../../api/chatApi";

function formatDateTime(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    return sameDay
      ? d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return "";
  }
}

export function ChatRoomListItem(props: {
  room: ChatRoomResponse;
  myUserId: number | null;
  onClick: () => void;
}) {
  const { room, myUserId, onClick } = props;

  const opponentNickname = useMemo(() => {
    if (myUserId != null && room.senderId === myUserId) return room.receiverNickname ?? "상대";
    if (myUserId != null && room.receiverId === myUserId) return room.senderNickname ?? "상대";
    return room.receiverNickname ?? room.senderNickname ?? "상대";
  }, [room.receiverId, room.receiverNickname, room.senderId, room.senderNickname, myUserId]);

  const boardTitle = (room.boardTitle ?? "").trim() || "게시글";
  const lastMessage = (room.lastMessage ?? "").trim() || "대화 내용이 없습니다.";
  const timeText = formatDateTime(room.lastMessageTime);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-5 py-4 hover:bg-secondary/20 transition border-b border-border last:border-b-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* 1줄: 게시글 제목 */}
          <div className="text-sm font-semibold text-foreground truncate">
            {boardTitle}
          </div>

          {/* 2줄: 상대 닉네임 + 마지막 메시지 */}
          <div className="mt-1 text-xs text-muted-foreground truncate">
            {opponentNickname}
          </div>

          <div className="mt-2 text-sm text-muted-foreground truncate">
            {lastMessage}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="text-xs text-muted-foreground">{timeText}</div>

          {Number(room.unreadCount ?? 0) > 0 && (
            <div className="min-w-[22px] h-[22px] px-2 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {room.unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
