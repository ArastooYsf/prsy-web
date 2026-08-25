"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import MediaPickerModal from "@/components/MediaPickerModal";

type MediaPickerProps = {
  label: string;
  value: string[];
  onChange: (paths: string[]) => void;
  multiple?: boolean;
};

export default function MediaPicker({ label, value, onChange, multiple = true }: MediaPickerProps) {
  const [open, setOpen] = useState(false);

  const removeSelected = (path: string) => {
    onChange(value.filter((p) => p !== path));
  };

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</p>

      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {value.map((path) => (
            <div key={path} className="relative h-20 w-20 shrink-0">
              <Image
                src={getMediaUrl(path)}
                alt=""
                fill
                sizes="80px"
                className="rounded-lg border border-foreground/10 object-cover"
              />
              <button
                type="button"
                onClick={() => removeSelected(path)}
                aria-label="حذف تصویر"
                className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110"
              >
                <X className="size-3" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-foreground/15 px-4 py-3 text-center text-sm text-foreground/60 transition-colors hover:border-accent-500/40"
      >
        <ImagePlus className="size-4" />
        {value.length > 0 ? "تغییر تصویر" : "انتخاب تصویر"}
      </button>

      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(assets) => onChange(assets.map((a) => a.url))}
        kind="image"
        scope="SITE_CONTENT"
        multiple={multiple}
        initialSelected={value}
      />
    </div>
  );
}
