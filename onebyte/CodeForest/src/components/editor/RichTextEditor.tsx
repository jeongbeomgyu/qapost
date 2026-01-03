import { useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import type { Editor } from "@tiptap/core";

// highlight.js grammars (register only what we need)
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import java from "highlight.js/lib/languages/java";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";

const lowlight = createLowlight();
lowlight.register({ javascript, typescript, java, python, sql, bash });

type Props = {
  value?: string; // HTML (optional initial/controlled)
  onChange?: (html: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: Editor) => void;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  onEditorReady,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // ✅ 요구사항: "쓸데없는 것 다 끔" (리스트/헤딩/인용 등 제거)
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false, // use CodeBlockLowlight instead
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        // 스타일은 전역 CSS(.ProseMirror / .tiptap-editor)에서 강제
        class: "tiptap-editor",
      },
    },
  });

  // external -> editor sync (avoid infinite loop)
  useEffect(() => {
    if (!editor) return;
    const next = value || "<p></p>";
    const current = editor.getHTML();
    if (next !== current) editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  const Btn = useMemo(
    () =>
      ({
        active,
        onClick,
        children,
      }: {
        active?: boolean;
        onClick: () => void;
        children: React.ReactNode;
      }) => (
        <button
          type="button"
          onClick={onClick}
          className={`px-3 py-1 rounded border text-sm transition-colors ${
            active ? "bg-primary/10 border-primary/30" : "bg-white border-border hover:bg-secondary/30"
          }`}
        >
          {children}
        </button>
      ),
    []
  );

  if (!editor) return null;

  return (
    <div className="space-y-3">
      {/* ✅ 툴바: 버튼 3개만 */}
      <div className="sticky top-16 z-10 bg-white border border-border rounded-lg p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            Bold
          </Btn>
          <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            Underline
          </Btn>
          <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            Code Block
          </Btn>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}


