import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  isChatOpen: boolean;
  chatMode: 'list' | 'conversation';
  selectedUser: { name: string; id: string; postId?: string } | null;
  openChatList: () => void;
  openChatWithUser: (userName: string, userId: string, postId?: string) => void;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'list' | 'conversation'>('list');
  const [selectedUser, setSelectedUser] = useState<{ name: string; id: string; postId?: string } | null>(null);

  const openChatList = () => {
    setIsChatOpen(true);
    setChatMode('list');
    setSelectedUser(null);
  };

  const openChatWithUser = (userName: string, userId: string, postId?: string) => {
    setSelectedUser({ name: userName, id: userId, postId });
    setChatMode('conversation');
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    // Reset to list view after a delay to avoid visual glitch
    setTimeout(() => {
      setChatMode('list');
      setSelectedUser(null);
    }, 300);
  };

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        chatMode,
        selectedUser,
        openChatList,
        openChatWithUser,
        closeChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
