import { http } from "./http";

export type ChatMessageResponse = {
  id?: number; // ✅ messageId 없을 수 있어서 optional
  roomId: number;
  senderId: number;
  senderNickname?: string;
  content: string;
  sendTime: string; // ISO
  isRead?: boolean;
  isDeleted?: boolean;
};

export type ChatRoomResponse = {
  id: number; // roomId
  boardId?: number;
  boardTitle?: string;
  senderId: number;
  senderNickname?: string;
  receiverId: number;
  receiverNickname?: string;
  lastMessage?: string;
  unreadCount?: number;
  lastMessageTime?: string;
};

export type SliceResponse<T> = {
  content: T[];
  hasNext: boolean;
  number?: number;
  size?: number;
};

function toNumber(v: any): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function toIsoOrNow(v: any): string {
  if (typeof v === "string" && v.trim()) return v;
  return new Date().toISOString();
}

function toStringOrEmpty(v: any): string {
  return typeof v === "string" ? v : "";
}

export function normalizeChatRoom(raw: any): ChatRoomResponse {
  return {
    id: toNumber(raw?.id ?? raw?.roomId) ?? 0,
    boardId: toNumber(raw?.boardId ?? raw?.boardID ?? raw?.postId) ?? undefined,
    boardTitle: toStringOrEmpty(raw?.boardTitle),
    senderId: toNumber(raw?.senderId ?? raw?.senderID) ?? 0,
    senderNickname: raw?.senderNickname ?? raw?.senderName ?? raw?.senderNick ?? "",
    receiverId: toNumber(raw?.receiverId ?? raw?.receiverID) ?? 0,
    receiverNickname: raw?.receiverNickname ?? raw?.receiverName ?? raw?.receiverNick ?? "",
    lastMessage: raw?.lastMessage ?? raw?.lastChat ?? raw?.recentMessage ?? "",
    unreadCount: toNumber(raw?.unreadCount ?? raw?.unread) ?? 0,
    lastMessageTime: raw?.lastMessageTime ?? raw?.lastSendTime ?? raw?.updatedAt,
  };
}

export function normalizeChatMessage(raw: any): ChatMessageResponse {
  // ✅ 백엔드가 messageId를 안내려줄 수 있음 -> 0으로 만들지 말고 undefined
  const id =
    raw?.id ??
    raw?.messageId ??
    raw?.chatMessageId ??
    raw?.chat_message_id ??
    raw?.chatMessage?.id;

  const roomId =
    raw?.roomId ??
    raw?.chatRoomId ??
    raw?.room_id ??
    raw?.chatRoom?.id ??
    raw?.chatRoom?.roomId;

  const senderId =
    raw?.senderId ??
    raw?.sender_id ??
    raw?.sender?.id ??
    raw?.sender?.userId ??
    raw?.sender?.memberId;

  const senderNickname =
    raw?.senderNickname ??
    raw?.sender_nickname ??
    raw?.sender?.nickname ??
    raw?.sender?.name ??
    "";

  const sendTime =
    raw?.sendTime ??
    raw?.sentTime ??
    raw?.createdAt ??
    raw?.created_at ??
    raw?.timestamp;

  const isDeleted =
    raw?.isDeleted ??
    raw?.deleted ??
    raw?.is_delete ??
    raw?.is_delete_message ??
    false;

  const isRead = raw?.isRead ?? raw?.read ?? raw?.is_read ?? false;

  return {
    ...(raw ?? {}),
    id: toNumber(id) ?? undefined,
    roomId: toNumber(roomId) ?? 0,
    senderId: toNumber(senderId) ?? 0,
    senderNickname: toStringOrEmpty(senderNickname),
    sendTime: toIsoOrNow(sendTime),
    isDeleted: Boolean(isDeleted),
    isRead: Boolean(isRead),
    content: toStringOrEmpty(raw?.content),
  };
}

// 1) 채팅방 생성/가져오기
export async function createOrGetChatRoom(boardId: number, receiverId: number): Promise<ChatRoomResponse> {
  const raw = await http<any>("/api/chat/room", {
    method: "POST",
    json: { boardId, receiverId },
  });
  return normalizeChatRoom(raw);
}

// 2) 내 채팅방 목록 조회 (+검색)
export async function fetchChatRooms(keyword?: string): Promise<ChatRoomResponse[]> {
  const qs = keyword?.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : "";
  const raw = await http<any[]>(`/api/chat/rooms${qs}`, { method: "GET" });
  return (raw ?? []).map(normalizeChatRoom);
}

// 3) 채팅방 메시지 조회 (Slice)
export async function fetchChatRoomMessages(roomId: number, page = 0, size = 30): Promise<SliceResponse<ChatMessageResponse>> {
  const raw = await http<any>(`/api/chat/room/${roomId}/messages?page=${page}&size=${size}`, {
    method: "GET",
  });

  const content = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];

  return {
    content: content.map(normalizeChatMessage),
    hasNext: Boolean(raw?.hasNext ?? raw?.has_next ?? raw?.hasMore ?? false),
    number: toNumber(raw?.number ?? raw?.page) ?? undefined,
    size: toNumber(raw?.size) ?? undefined,
  };
}

// 4) 메시지 수정
export async function updateChatMessage(messageId: number, content: string): Promise<ChatMessageResponse> {
  const raw = await http<any>(`/api/chat/message/${messageId}`, {
    method: "PATCH",
    json: { content },
  });
  return normalizeChatMessage(raw);
}

// 5) 메시지 삭제
export async function deleteChatMessage(messageId: number): Promise<void> {
  await http<void>(`/api/chat/message/${messageId}`, { method: "DELETE" });
}

// 6) 채팅방 나가기
export async function leaveChatRoom(roomId: number): Promise<void> {
  await http<void>(`/api/chat/room/${roomId}`, { method: "DELETE" });
}
