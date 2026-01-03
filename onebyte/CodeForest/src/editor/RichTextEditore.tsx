import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";

const lowlight = createLowlight();

type Props = {
  value: string; // HTML
  onChange: (html: string) => void;
};

export default function RichEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 기본 코드블럭 끄고
      }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[260px] w-full rounded-lg border border-border bg-white px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // value가 바뀌면 에디터에도 반영 (ex: 초기값/리셋)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "<p></p>") !== current) {
      editor.commands.setContent(value || "<p></p>");
    }
  }, [value, editor]);

  if (!editor) return null;

  const Btn = ({
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
  );

  return (
    <div className="space-y-2">
      {/* 툴바 */}
      <div className="flex flex-wrap gap-2">
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </Btn>
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • List
        </Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. List
        </Btn>
        <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          Code Block
        </Btn>
      </div>

      {/* 에디터 */}
      <EditorContent editor={editor} />
      <p className="text-xs text-muted-foreground">
        코드블럭: 버튼 누르고 붙여넣기 / 또는 작성 후 블록 선택하고 Code Block 눌러도 됨.
      </p>
    </div>
  );
}
