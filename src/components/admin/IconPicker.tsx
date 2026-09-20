"use client";

import type { ReactNode } from "react";
import { ICON_OPTIONS, type IconKey } from "@/lib/site-content-defaults";
import { cn } from "@/lib/utils";

export type IconPickerOption<K extends string> = { key: K; label: string; icon: ReactNode };

type IconPickerProps<K extends string> = {
  label: string;
  value: K;
  onChange: (key: K) => void;
  /** Defaults to the shared content-card icon set (ICON_OPTIONS); the product category manager passes its own set. */
  options?: readonly IconPickerOption<K>[];
};

const DEFAULT_OPTIONS: readonly IconPickerOption<IconKey>[] = ICON_OPTIONS.map(({ key, label, Icon }) => ({
  key,
  label,
  icon: <Icon size={18} />,
}));

// A closed grid — not a free-text field, so a saved value can never point at
// an icon that doesn't exist.
export default function IconPicker<K extends string = IconKey>({
  label,
  value,
  onChange,
  options = DEFAULT_OPTIONS as unknown as readonly IconPickerOption<K>[],
}: IconPickerProps<K>) {
  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(({ key, label: iconLabel, icon }) => (
          <button
            key={key}
            type="button"
            title={iconLabel}
            aria-label={iconLabel}
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg border transition-colors",
              value === key
                ? "border-accent-500 bg-accent-500/15 text-accent-400"
                : "border-foreground/10 bg-foreground/5 text-foreground/60 hover:border-foreground/20 hover:text-foreground",
            )}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
