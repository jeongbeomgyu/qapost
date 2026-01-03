import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@stomp/stompjs";

import { useAuth } from "../../contexts/AuthContext";
import {
  deleteChatMessage,
  fetchChatRoomMessages,
  normalizeChatMessage,
  updateChatMessage,
  leaveChatRoom,
  type ChatMessageResponse,
  type ChatRoomResponse,
} from "../../api/chatApi";
import { createChatStompClient, publishChatMessage } from "../../lib/stompClient";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatMessageComposer } from "./ChatMessageComposer";

function sortByTimeAsc(list: ChatMessageResponse[]) {
  return [...list].sort((a, b) => new Date(a.sendTime).getTime() - new Date(b.sendTime).getTime());
}

function messageKey(m: ChatMessageResponse, idx: number) {
  // id가 없을 수 있다고 가정(방어): 있으면 id, 없으면 시간+index
  const id = (m as any)?.id;
  if (typeof id === "number" && id > 0) return `id:${id}`;
  return `t:${m.sendTime}:${idx}`;
}

export function ChatRoomPanel(props: {
  roomId: number;
  roomInfo?: ChatRoomResponse | null;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { me } = useAuth();

  const myUserId = useMemo(() => {
    const ctxId = me?.id ?? null;
    if (ctxId != null) return ctxId;
    const raw = localStorage.getItem("userId");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [me?.id]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<Client | null>(null);

  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const size = 30;

  const upsertMessage = (incoming: ChatMessageResponse) => {
    const incomingId = (incoming as any)?.id;
    if (!(typeof incomingId === "number" && incomingId > 0)) {
      // id가 없으면 업데이트 불가 -> append만
      setMessages((prev) => sortByTimeAsc([...prev, incoming]));
      return;
    }

    setMessages((prev) => {
      const idx = prev.findIndex((m) => (m as any)?.id === incomingId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...prev[idx], ...incoming };
        return sortByTimeAsc(next);
      }
      return sortByTimeAsc([...prev, incoming]);
    });
  };

  const markDeletedLocal = (messageId: number) => {
    setMessages((prev) =>
      prev.map((m) =>
        (m as any)?.id === messageId ? { ...m, isDeleted: true, content: "삭제된 메시지입니다." } : m
      )
    );
  };

  const loadPage = async (p: number, mode: "initial" | "prepend") => {
    if (!Number.isFinite(props.roomId)) return;
    try {
      if (mode === "initial") {
        setLoading(true);
        setError(false);
      } else {
        setLoadingMore(true);
      }

      const before = scrollRef.current
        ? { top: scrollRef.current.scrollTop, height: scrollRef.current.scrollHeight }
        : null;

      const slice = await fetchChatRoomMessages(props.roomId, p, size);
      const fetched = sortByTimeAsc(slice.content.map(normalizeChatMessage));

      setHasNext(slice.hasNext);
      setPage(p);

      setMessages((prev) => {
        if (mode === "initial") return fetched;

        const merged = [...fetched, ...prev];
        const map = new Map<string, ChatMessageResponse>();
        for (const m of merged) {
          const id = (m as any)?.id;
          const key = typeof id === "number" && id > 0 ? `id:${id}` : `t:${m.sendTime}:${m.senderId}:${m.content}`;
          map.set(key, m);
        }
        return sortByTimeAsc(Array.from(map.values()));
      });

      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (mode === "initial") {
          el.scrollTop = el.scrollHeight;
        } else if (before) {
          const afterHeight = el.scrollHeight;
          el.scrollTop = afterHeight - before.height + before.top;
        }
      });
    } catch (e: any) {
      setError(true);
      toast.error(e?.message ?? "메시지를 불러오지 못했습니다");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // initial load (roomId changed)
  useEffect(() => {
    if (!Number.isFinite(props.roomId)) return;
    setMessages([]);
    setPage(0);
    setHasNext(false);
    void loadPage(0, "initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.roomId]);

  // STOMP connect
  useEffect(() => {
    if (!Number.isFinite(props.roomId)) return;

    const client = createChatStompClient({
      roomId: props.roomId,
      onMessage: (raw) => {
        const msg = normalizeChatMessage(raw);
        upsertMessage(msg);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        client.deactivate();
      } catch {}
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.roomId]);

  const handleSend = (content: string) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      toast.error("실시간 연결 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    publishChatMessage(client, { roomId: props.roomId, content });
  };

  const handleEdit = async (messageId: number, nextContent: string) => {
    const updated = await updateChatMessage(messageId, nextContent);
    upsertMessage(updated);
  };

  const handleDelete = async (messageId: number) => {
    await deleteChatMessage(messageId);
    markDeletedLocal(messageId);
  };

  const handleLeave = async () => {
    if (!window.confirm("채팅방을 나갈까요?")) return;
    try {
      await leaveChatRoom(props.roomId);
      toast.success("채팅방을 나갔습니다");
      try {
        clientRef.current?.deactivate();
      } catch {}
      props.onBack();
    } catch (e: any) {
      toast.error(e?.message ?? "채팅방 나가기 실패");
    }
  };

  const boardTitle =
    (props.roomInfo?.boardTitle ?? "").trim() ||
    (props.roomInfo?.boardId ? `게시글 #${props.roomInfo.boardId}` : `채팅방 #${props.roomId}`);

  const opponentNickname =
    props.roomInfo && myUserId != null
      ? props.roomInfo.senderId === myUserId
        ? props.roomInfo.receiverNickname ?? ""
        : props.roomInfo.senderNickname ?? ""
      : "";

  const boardId = props.roomInfo?.boardId;
  const canGoBoard = typeof boardId === "number" && Number.isFinite(boardId);

  return (
    <div className="flex flex-col h-full">
      {/* room header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-[#fafaf8]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={props.onBack}
            className="p-2 rounded hover:bg-secondary/40"
            aria-label="뒤로"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            {canGoBoard ? (
              <button
                type="button"
                onClick={() => {
                  if (!canGoBoard) return;
                  // ✅ 프로젝트 게시글 상세 라우트: /post/:id
                  navigate(`/post/${boardId}`);
                }}
                className="font-medium text-foreground truncate max-w-[320px] hover:underline text-left"
                title={boardTitle}
              >
                {boardTitle}
              </button>
            ) : (
              <div className="font-medium text-foreground truncate max-w-[320px]" title={boardTitle}>
                {boardTitle}
              </div>
            )}

            <div className="mt-1 text-xs text-muted-foreground truncate max-w-[320px]">{opponentNickname}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLeave}
          className="inline-flex items-center gap-2 px-3 py-2 rounded border border-border hover:bg-secondary/30 text-red-600"
        >
          <LogOut className="w-4 h-4" />
          나가기
        </button>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-white to-secondary/10"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop <= 20 && hasNext && !loadingMore && !loading) {
            void loadPage(page + 1, "prepend");
          }
        }}
      >
        {loading && <div className="text-muted-foreground">불러오는 중...</div>}
        {!loading && error && (
          <div className="space-y-3">
            <div className="text-muted-foreground">불러오지 못했습니다</div>
            <button
              type="button"
              onClick={() => void loadPage(0, "initial")}
              className="px-4 py-2 rounded border border-border hover:bg-secondary/30"
            >
              재시도
            </button>
          </div>
        )}

        {loadingMore && <div className="text-xs text-muted-foreground text-center">이전 메시지 불러오는 중...</div>}

        {!loading && !error && messages.length === 0 && (
          <div className="text-center text-muted-foreground py-10">대화를 시작해보세요.</div>
        )}

        {!loading &&
          !error &&
          messages.map((m, idx) => {
            const isMine = myUserId != null && m.senderId === myUserId;
            return (
              <ChatMessageBubble
                key={messageKey(m, idx)}
                message={m}
                isMine={isMine}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })}
      </div>

      <ChatMessageComposer onSend={handleSend} disabled={!Number.isFinite(props.roomId)} />
    </div>
  );
}


