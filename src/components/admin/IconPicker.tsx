"use client";

import { ICON_OPTIONS, type IconKey } from "@/lib/site-content-defaults";
import { cn } from "@/lib/utils";

type IconPickerProps = {
  label: string;
  value: IconKey;
  onChange: (key: IconKey) => void;
};

// A closed grid of the same 13 icons already hardcoded across WhyUs/Features/
// Customers/About before this became editable — not a free-text field, so a
// saved value can never point at an icon that doesn't exist.
export default function IconPicker({ label, value, onChange }: IconPickerProps) {
  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</p>
      <div className="flex flex-wrap gap-2">
        {ICON_OPTIONS.map(({ key, label: iconLabel, Icon }) => (
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
            <Icon size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
