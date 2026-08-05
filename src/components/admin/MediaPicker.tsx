"use client";

import { useState } from "react";
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
              <img
                src={getMediaUrl(path)}
                alt=""
                className="h-full w-full rounded-lg border border-white/10 object-cover"
              />
              <button
                type="button"
                onClick={() => removeSelected(path)}
                aria-label="حذف تصویر"
                className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full cursor-pointer rounded-lg border border-dashed border-white/15 px-4 py-3 text-center text-sm text-foreground/60 transition-colors hover:border-accent-500/40"
      >
        {value.length > 0 ? "تغییر تصویر" : "انتخاب تصویر"}
      </button>

      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(assets) => onChange(assets.map((a) => a.url))}
        kind="image"
        multiple={multiple}
        initialSelected={value}
      />
    </div>
  );
}
