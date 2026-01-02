import { useState, useEffect } from "react";
import { X, Search, ArrowLeft, Send, User, MessageCircle } from "lucide-react";
import { chatRooms, chatMessages, ChatRoom, ChatMessage } from "../data/chatData";
import { useChat } from "../contexts/ChatContext";

export function UnifiedChatPanel() {
  const { isChatOpen, chatMode, selectedUser, closeChat } = useChat();
  const [view, setView] = useState<"list" | "conversation">("list");
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

/**
 * NOTE:
 * - 현재는 mock(chatData) 기반 UI-only 채팅 패널입니다. (백엔드 연동 없음)
 * - 추후 연동 시:
 *   1) 채팅방 목록: GET /api/chat/rooms
 *   2) 메시지 목록: GET /api/chat/rooms/{roomId}/messages
 *   3) 전송: WS(STOMP) or POST /api/chat/messages
 */

  // Sync view with chat mode from context
  useEffect(() => {
    setView(chatMode);

    if (chatMode === "conversation" && selectedUser) {
      // ✅ 백엔드 기준: userId는 string으로 통일
      // selectedUser가 { userId }로 오든 { id }로 오든 여기서 정규화
      const uid = String((selectedUser as any).userId ?? (selectedUser as any).id);

      const roomId = selectedUser.postId ? `${uid}_${selectedUser.postId}` : uid;

      let room = chatRooms.find(
        (r) =>
          r.userId === uid &&
          (selectedUser.postId ? r.postId === selectedUser.postId : true)
      );

      // If no room exists, create a new one
      if (!room) {
        room = {
          id: roomId,
          userId: uid, // ✅ string
          userName: selectedUser.name,
          postId: selectedUser.postId,
          postTitle: selectedUser.postId ? "현재 게시글" : undefined,
          lastMessage: "",
          lastMessageTime: "방금",
          unreadCount: 0,
          isOnline: true,
        };
      }

      setSelectedRoom(room);
    } else {
      setSelectedRoom(null);
    }
  }, [chatMode, selectedUser]);

  const handleRoomClick = (room: ChatRoom) => {
    setSelectedRoom(room);
    setView("conversation");
  };

  const handleBack = () => {
    setView("list");
    setSelectedRoom(null);
  };

  const handleSend = () => {
    if (inputText.trim() && selectedRoom) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        chatRoomId: selectedRoom.id,
        sender: "me",
        text: inputText,
        time: new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, newMessage]); // ✅ 최신 state 안전
      setInputText("");
    }
  };

  const filteredRooms = chatRooms.filter((room) =>
    room.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedRoom
    ? messages.filter((msg) => msg.chatRoomId === selectedRoom.id)
    : [];

  if (!isChatOpen) return null;

  return (
    <>
      {/* Backdrop - semi-transparent, non-modal */}
      <div className="fixed inset-0 bg-black/10 z-40 transition-opacity" onClick={closeChat} />

      {/* Sliding Panel */}
      <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right border-l border-border">
        {view === "list" ? (
          <>
            {/* Chat List Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <h2 className="text-foreground">채팅</h2>
              <button onClick={closeChat} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="대화 상대 검색"
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6 text-center">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-30" />
                  <p>채팅 내역이 없습니다</p>
                  <p className="text-sm mt-2">게시글 작성자를 클릭하여 대화를 시작하세요</p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => handleRoomClick(room)}
                    className="w-full flex items-start gap-3 px-6 py-4 hover:bg-secondary/30 transition-colors border-b border-border/50 text-left"
                  >
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      {room.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground">{room.userName}</span>
                        <span className="text-xs text-muted-foreground">{room.lastMessageTime}</span>
                      </div>
                      {room.postTitle && (
                        <div className="text-xs text-primary/70 mb-1 truncate">📄 {room.postTitle}</div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate pr-2">{room.lastMessage}</p>
                        {room.unreadCount > 0 && (
                          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-secondary rounded-lg transition-colors -ml-2"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="flex-1">
                <div className="font-medium text-foreground">{selectedRoom?.userName}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {selectedRoom?.isOnline ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      온라인
                    </>
                  ) : (
                    "오프라인"
                  )}
                  {selectedRoom?.postTitle && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">{selectedRoom.postTitle}</span>
                    </>
                  )}
                </div>
              </div>
              <button onClick={closeChat} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gradient-to-b from-white to-secondary/10">
              {currentMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <User className="w-16 h-16 mb-4 opacity-20" />
                  <p>대화를 시작해보세요</p>
                </div>
              ) : (
                currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[75%] ${message.sender === "me" ? "order-2" : "order-1"}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          message.sender === "me"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-white border border-border text-foreground rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {message.text}
                      </div>
                      <div
                        className={`text-xs text-muted-foreground mt-1 px-1 ${
                          message.sender === "me" ? "text-right" : "text-left"
                        }`}
                      >
                        {message.time}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()} // ✅ onKeyPress deprecated 대응
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2.5 bg-secondary/30 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
