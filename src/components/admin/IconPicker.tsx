"use client";

import { CATEGORY_ICON_KEYS, CATEGORY_ICONS, CATEGORY_ICON_LABELS, type CategoryIconKey } from "@/lib/category-icons";

type IconPickerProps = {
  value: CategoryIconKey;
  onChange: (key: CategoryIconKey) => void;
};

export default function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-foreground/80">آیکون</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {CATEGORY_ICON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={CATEGORY_ICON_LABELS[key]}
            aria-label={CATEGORY_ICON_LABELS[key]}
            className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
              value === key
                ? "border-accent-500 bg-accent-500/15 text-accent-400"
                : "border-foreground/10 text-foreground/60 hover:border-foreground/20 hover:text-foreground"
            }`}
          >
            {CATEGORY_ICONS[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
