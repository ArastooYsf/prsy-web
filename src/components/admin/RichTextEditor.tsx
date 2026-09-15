"use client";

import { useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  TextB,
  TextItalic,
  TextStrikethrough,
  ListBullets,
  ListNumbers,
  Quotes,
  LinkSimple,
  Image as ImageIcon,
  Minus,
  ArrowCounterClockwise,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { getMediaUrl } from "@/lib/media";
import MediaPickerModal from "@/components/MediaPickerModal";
import { useSiteTheme } from "@/components/RouteThemeScope";
import { cn } from "@/lib/utils";

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
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-accent-500 text-white" : "text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-foreground/10" />;
}

function Toolbar({ editor, onOpenImagePicker }: { editor: Editor; onOpenImagePicker: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-lg border-b border-foreground/10 bg-background p-2">
      <ToolbarButton label="بولد" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <TextB size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton label="ایتالیک" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <TextItalic size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton label="خط‌خورده" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <TextStrikethrough size={16} weight="bold" />
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
        <ListBullets size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        label="لیست شماره‌دار"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbers size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        label="نقل‌قول"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quotes size={16} weight="bold" />
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
        <LinkSimple size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton label="افزودن عکس" onClick={onOpenImagePicker}>
        <ImageIcon size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton label="خط جداکننده" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={16} weight="bold" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton label="واگرد" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <ArrowCounterClockwise size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton label="ازنو" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <ArrowClockwise size={16} weight="bold" />
      </ToolbarButton>
    </div>
  );
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const isDark = useSiteTheme()?.theme === "dark";

  const editor = useEditor(
    {
      extensions: [StarterKit.configure({ link: { openOnClick: false } }), Image],
      content: value,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm max-w-none min-h-[240px] px-4 py-3 text-sm leading-7 outline-none [&_a]:text-accent-400",
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
      <Toolbar editor={editor} onOpenImagePicker={() => setImagePickerOpen(true)} />
      <EditorContent editor={editor} dir="rtl" />

      <MediaPickerModal
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        kind="image"
        scope="SITE_CONTENT"
        multiple
        hint="عرض توصیه‌شده حدود ۱۲۰۰ پیکسل (به‌اندازه‌ی عرض متن پست) — تصویر عریض‌تر فقط حجم صفحه را زیاد می‌کند. JPG یا WEBP، حداکثر ۸ مگابایت."
        onConfirm={(assets) => {
          assets.forEach((asset) => {
            const src = getMediaUrl(asset.url);
            // Read the real pixel dimensions before inserting so the saved
            // HTML carries width/height — without them the browser can't
            // reserve space for the image before it loads, causing layout
            // shift as the post's text jumps once each image arrives.
            const probe = new window.Image();
            probe.onload = () => {
              editor
                .chain()
                .focus()
                .setImage({ src, alt: asset.filename, width: probe.naturalWidth, height: probe.naturalHeight })
                .run();
            };
            probe.onerror = () => {
              editor.chain().focus().setImage({ src, alt: asset.filename }).run();
            };
            probe.src = src;
          });
        }}
      />
    </div>
  );
}
