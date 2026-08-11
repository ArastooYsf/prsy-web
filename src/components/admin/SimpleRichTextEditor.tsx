"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type SimpleRichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
        active ? "bg-accent-500 text-white" : "text-foreground/70 hover:bg-white/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function SimpleRichTextEditor({ value, onChange }: SimpleRichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: false, blockquote: false, codeBlock: false, horizontalRule: false })],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none min-h-[80px] px-3 py-2.5 text-sm leading-7 outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <div className="flex items-center gap-1 border-b border-white/10 p-1.5">
        <ToolbarButton label="بولد" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M7 5h6a3.5 3.5 0 010 7H7V5zM7 12h7a3.5 3.5 0 010 7H7v-7z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          label="لیست نقطه‌ای"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="5" cy="18" r="1.2" fill="currentColor" stroke="none" />
            <path stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M9 6h10M9 12h10M9 18h10" />
          </svg>
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} dir="rtl" />
    </div>
  );
}
