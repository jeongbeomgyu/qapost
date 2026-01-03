import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ChatDrawerContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const ChatDrawerContext = createContext<ChatDrawerContextType | null>(null);

export function ChatDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
    }),
    [isOpen]
  );

  return <ChatDrawerContext.Provider value={value}>{children}</ChatDrawerContext.Provider>;
}

export function useChatDrawer() {
  const ctx = useContext(ChatDrawerContext);
  if (!ctx) throw new Error("useChatDrawer must be used within ChatDrawerProvider");
  return ctx;
}


