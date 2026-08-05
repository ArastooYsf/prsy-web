"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { getMediaUrl } from "@/lib/media";
import MediaPickerModal from "@/components/MediaPickerModal";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
};

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-accent-500 text-white" : "text-foreground/70 hover:bg-white/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />;
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function Toolbar({ editor, onOpenImagePicker }: { editor: Editor; onOpenImagePicker: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-lg border-b border-white/10 bg-background p-2">
      <ToolbarButton label="بولد" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Icon>
          <path stroke="currentColor" d="M7 5h6a3.5 3.5 0 010 7H7V5zM7 12h7a3.5 3.5 0 010 7H7v-7z" />
        </Icon>
      </ToolbarButton>
      <ToolbarButton label="ایتالیک" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Icon>
          <path stroke="currentColor" d="M10 5h7M7 19h7M14 5l-4 14" />
        </Icon>
      </ToolbarButton>
      <ToolbarButton label="خط‌خورده" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Icon>
          <path stroke="currentColor" d="M5 12h14M8 7c0-1.5 1.5-2.5 4-2.5s4 1 4 2.5-1.5 2-4 2.5M8 17c0 1.5 1.5 2.5 4 2.5s4-1 4-2.5" />
        </Icon>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="سرتیتر بزرگ"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="text-xs font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton
        label="سرتیتر کوچک"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="text-xs font-bold">H3</span>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="لیست نقطه‌ای"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <Icon>
          <circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="5" cy="18" r="1.2" fill="currentColor" stroke="none" />
          <path stroke="currentColor" d="M9 6h10M9 12h10M9 18h10" />
        </Icon>
      </ToolbarButton>
      <ToolbarButton
        label="لیست شماره‌دار"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <Icon>
          <path stroke="currentColor" d="M9 6h10M9 12h10M9 18h10" />
          <text x="2" y="8" fontSize="6" fill="currentColor" stroke="none">1</text>
          <text x="2" y="14" fontSize="6" fill="currentColor" stroke="none">2</text>
          <text x="2" y="20" fontSize="6" fill="currentColor" stroke="none">3</text>
        </Icon>
      </ToolbarButton>
      <ToolbarButton
        label="نقل‌قول"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Icon>
          <path stroke="currentColor" d="M7 8a3 3 0 00-3 3v2a2 2 0 002 2h1v-4H6a1 1 0 011-1V8zm9 0a3 3 0 00-3 3v2a2 2 0 002 2h1v-4h-1a1 1 0 011-1V8z" fill="currentColor" strokeWidth="0" />
        </Icon>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="افزودن لینک"
        active={editor.isActive("link")}
        onClick={() => {
          const url = window.prompt("آدرس لینک را وارد کنید:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
          else editor.chain().focus().unsetLink().run();
        }}
      >
        <Icon>
          <path
            stroke="currentColor"
            d="M9.5 14.5l5-5M8 12l-2 2a3 3 0 004.24 4.24l2-2M16 12l2-2a3 3 0 00-4.24-4.24l-2 2"
          />
        </Icon>
      </ToolbarButton>
      <ToolbarButton label="افزودن عکس" onClick={onOpenImagePicker}>
        <Icon>
          <rect x="4" y="5" width="16" height="14" rx="1.5" stroke="currentColor" />
          <circle cx="9" cy="10" r="1.3" fill="currentColor" stroke="none" />
          <path stroke="currentColor" d="M5 16l4.5-4.5a1.5 1.5 0 012.1 0L15 15l1.2-1.2a1.5 1.5 0 012.1 0L20 15.5" />
        </Icon>
      </ToolbarButton>
      <ToolbarButton label="خط جداکننده" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Icon>
          <path stroke="currentColor" d="M5 12h14" />
        </Icon>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton label="واگرد" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Icon>
          <path stroke="currentColor" d="M7 10h8a4 4 0 010 8h-2M7 10l3-3M7 10l3 3" />
        </Icon>
      </ToolbarButton>
      <ToolbarButton label="ازنو" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Icon>
          <path stroke="currentColor" d="M17 10H9a4 4 0 000 8h2M17 10l-3-3M17 10l-3 3" />
        </Icon>
      </ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-sm max-w-none min-h-[240px] px-4 py-3 text-sm leading-7 outline-none [&_a]:text-accent-400",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <Toolbar editor={editor} onOpenImagePicker={() => setImagePickerOpen(true)} />
      <EditorContent editor={editor} dir="rtl" />

      <MediaPickerModal
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        kind="image"
        multiple
        onConfirm={(assets) => {
          assets.forEach((asset) => {
            editor.chain().focus().setImage({ src: getMediaUrl(asset.url) }).run();
          });
        }}
      />
    </div>
  );
}
