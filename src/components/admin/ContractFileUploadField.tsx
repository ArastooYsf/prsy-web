"use client";

import { useState } from "react";
import MediaPickerModal from "@/components/MediaPickerModal";
import { FileTypeIcon, fileKindFromName } from "@/components/FileTypeIcon";

type ContractFileUploadFieldProps = {
  value: string;
  onChange: (relativePath: string) => void;
};

export default function ContractFileUploadField({ value, onChange }: ContractFileUploadFieldProps) {
  const [open, setOpen] = useState(false);
  const [pickedName, setPickedName] = useState<string | null>(null);

  const displayName = pickedName ?? (value ? value.split("/").pop() : null);

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-foreground/80">فایل پیوست قرارداد</p>
      <div className="flex items-center gap-3">
        {value && displayName && (
          <span className="flex items-center gap-1.5 truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground/70">
            <FileTypeIcon kind={fileKindFromName(displayName)} />
            <span className="truncate">{displayName}</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 cursor-pointer rounded-lg border border-dashed border-white/15 px-4 py-3 text-center text-sm text-foreground/60 transition-colors hover:border-accent-500/40"
        >
          {value ? "تغییر فایل" : "انتخاب یا آپلود فایل (PDF، عکس یا DOCX)"}
        </button>
      </div>

      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        kind="all"
        scope="CONTRACT_FILE"
        multiple={false}
        initialSelected={value ? [value] : []}
        onConfirm={(assets) => {
          if (assets[0]) {
            onChange(assets[0].url);
            setPickedName(assets[0].filename);
          }
        }}
      />
    </div>
  );
}
