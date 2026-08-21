"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, User } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import MediaPickerModal from "@/components/MediaPickerModal";

type AvatarUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  nameForAlt: string;
};

export default function AvatarUploader({ value, onChange, nameForAlt }: AvatarUploaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
          {value ? (
            <Image src={getMediaUrl(value)} alt={nameForAlt} fill sizes="96px" className="object-cover" />
          ) : (
            <User className="size-10 text-foreground/30" />
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="تغییر عکس پروفایل"
          className="absolute -bottom-1 -left-1 flex size-9 items-center justify-center rounded-full border-2 border-background bg-accent-500 text-white shadow-lg transition-colors hover:bg-accent-600"
        >
          <Camera className="size-4" />
        </button>
      </div>

      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={(assets) => onChange(assets[0]?.url ?? "")}
        kind="image"
        scope="PROFILE_AVATAR"
        multiple={false}
        initialSelected={value ? [value] : []}
      />
    </div>
  );
}
