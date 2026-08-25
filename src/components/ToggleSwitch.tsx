"use client";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLabel: string;
  offLabel: string;
  className?: string;
};

export default function ToggleSwitch({ checked, onChange, onLabel, offLabel, className = "" }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex min-h-11 items-center gap-2 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground ${className}`}
    >
      <span>{checked ? onLabel : offLabel}</span>
      <span
        dir="ltr"
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-accent-500" : "bg-foreground/15"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[4px]"
          }`}
        />
      </span>
    </button>
  );
}
