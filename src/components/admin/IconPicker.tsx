"use client";

import { type ReactNode, useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { ICON_OPTIONS, type IconKey } from "@/lib/site-content-defaults";
import { useScrollIntoViewOnOpen } from "@/hooks/useScrollIntoViewOnOpen";
import { useSiteTheme } from "@/components/RouteThemeScope";
import { popoverAnimation } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type IconPickerOption<K extends string> = { key: K; label: string; icon: ReactNode };

type IconPickerProps<K extends string> = {
  label: string;
  value: K;
  onChange: (key: K) => void;
  /** Defaults to the full project-wide Phosphor icon set (ICON_OPTIONS); the product category manager passes its own set. */
  options?: readonly IconPickerOption<K>[];
};

const DEFAULT_OPTIONS: readonly IconPickerOption<IconKey>[] = ICON_OPTIONS.map(({ key, label, Icon }) => ({
  key,
  label,
  icon: <Icon size={18} />,
}));

// A closed grid — not a free-text field, so a saved value can never point at
// an icon that doesn't exist. Popover + live search grid mirrors the emoji
// picker's UI pattern (src/components/EmojiPicker.tsx): a compact trigger
// showing the current selection, a search box, and a scrollable grid of
// icon-only buttons (no labels beside them — label is tooltip-only).
export default function IconPicker<K extends string = IconKey>({
  label,
  value,
  onChange,
  options = DEFAULT_OPTIONS as unknown as readonly IconPickerOption<K>[],
}: IconPickerProps<K>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const contentRef = useScrollIntoViewOnOpen<HTMLDivElement>(open);
  const siteTheme = useSiteTheme();
  const isLightTheme = siteTheme?.theme !== "dark";

  const selected = options.find((o) => o.key === value);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options;
    return options.filter((o) => o.label.includes(q) || o.key.includes(q));
  }, [options, query]);

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</p>
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex h-10 min-w-[6rem] items-center gap-2 rounded-lg border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground/80 transition-colors hover:border-foreground/20"
          >
            {selected ? (
              <>
                {selected.icon}
                <span className="truncate">{selected.label}</span>
              </>
            ) : (
              <span className="text-foreground/40">انتخاب آیکون</span>
            )}
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            ref={contentRef}
            side="bottom"
            align="start"
            sideOffset={8}
            collisionPadding={8}
            className={cn(
              "z-50 flex w-72 flex-col overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-2xl",
              isLightTheme && "theme-white-blue",
              popoverAnimation,
            )}
          >
            <div className="flex items-center gap-2 border-b border-foreground/10 px-3 py-2">
              <MagnifyingGlass size={16} className="shrink-0 text-foreground/40" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی آیکون..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
              />
            </div>

            <div className="grid max-h-64 grid-cols-6 gap-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="col-span-6 py-6 text-center text-xs text-foreground/40">آیکونی یافت نشد.</p>
              ) : (
                filtered.map(({ key, label: iconLabel, icon }) => (
                  <button
                    key={key}
                    type="button"
                    title={iconLabel}
                    aria-label={iconLabel}
                    aria-pressed={value === key}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg border transition-colors",
                      value === key
                        ? "border-accent-500 bg-accent-500/15 text-accent-400"
                        : "border-transparent text-foreground/60 hover:border-foreground/20 hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    {icon}
                  </button>
                ))
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
