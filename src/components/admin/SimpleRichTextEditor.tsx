"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextB, ListBullets } from "@phosphor-icons/react";
import { useSiteTheme } from "@/components/RouteThemeScope";
import { cn } from "@/lib/utils";

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
      className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${
        active ? "bg-accent-500 text-white" : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function SimpleRichTextEditor({ value, onChange }: SimpleRichTextEditorProps) {
  const isDark = useSiteTheme()?.theme === "dark";

  const editor = useEditor(
    {
      extensions: [StarterKit.configure({ heading: false, blockquote: false, codeBlock: false, horizontalRule: false })],
      content: value,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm max-w-none min-h-[80px] px-3 py-2.5 text-sm leading-7 outline-none",
            isDark && "prose-invert",
          ),
        },
      },
      onUpdate: ({ editor }) => onChange(editor.getHTML()),
    },
    [isDark],
  );

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/5">
      <div className="flex items-center gap-1 border-b border-foreground/10 p-1.5">
        <ToolbarButton label="بولد" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <TextB size={14} weight="bold" />
        </ToolbarButton>
        <ToolbarButton
          label="لیست نقطه‌ای"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListBullets size={14} weight="bold" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} dir="rtl" />
    </div>
  );
}
