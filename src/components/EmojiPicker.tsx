"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

// Twemoji set (not "native") so emoji render identically across
// Android/iOS/Windows/macOS instead of relying on each OS's own emoji font.
export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="افزودن ایموجی"
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8.5 14c.8 1.2 2 2 3.5 2s2.7-.8 3.5-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
          </svg>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content side="top" align="start" sideOffset={8} collisionPadding={8} className="z-20">
          <Picker
            data={data}
            set="twemoji"
            theme="dark"
            locale="fa"
            previewPosition="none"
            skinTonePosition="search"
            // Selecting an emoji must not close the picker — the user can pick
            // several in a row. Only a real outside click (Radix dismissal) closes it.
            onEmojiSelect={(emoji: { native: string }) => {
              onSelect(emoji.native);
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
