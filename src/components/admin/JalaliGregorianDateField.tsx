"use client";

import { formatGregorian, formatJalali } from "@/lib/jalali";
import JalaliDatePicker from "@/components/admin/JalaliDatePicker";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent-500/50";

type JalaliGregorianDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  calendar: "jalali" | "gregorian";
};

export default function JalaliGregorianDateField({ label, value, onChange, calendar }: JalaliGregorianDateFieldProps) {
  const oppositeCaption = value ? (calendar === "jalali" ? formatGregorian(value) : formatJalali(value)) : null;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</label>
      {calendar === "gregorian" ? (
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      ) : (
        <JalaliDatePicker value={value} onChange={onChange} />
      )}
      {oppositeCaption && <p dir="ltr" className="mt-1.5 text-left text-xs text-foreground/40">{oppositeCaption}</p>}
    </div>
  );
}
