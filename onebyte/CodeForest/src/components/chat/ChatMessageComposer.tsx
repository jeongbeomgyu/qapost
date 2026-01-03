import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

export function ChatMessageComposer(props: {
  onSend: (content: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // keep focus for chat UX
    ref.current?.focus();
  }, []);

  const send = () => {
    const trimmed = value.replace(/\u00a0/g, " ").trim();
    if (!trimmed) return;
    props.onSend(trimmed);
    setValue("");
  };

  return (
    <div className="p-4 border-t border-border bg-white">
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={props.disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="메시지를 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)"
          className="flex-1 resize-none px-4 py-3 bg-secondary/30 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={send}
          disabled={props.disabled || !value.trim()}
          className="h-11 w-11 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="전송"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


