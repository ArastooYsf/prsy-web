"use client";

import { formatGregorian, formatJalali } from "@/lib/jalali";
import JalaliDatePicker from "@/components/admin/JalaliDatePicker";
import GregorianDatePicker from "@/components/admin/GregorianDatePicker";

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
        <GregorianDatePicker value={value} onChange={onChange} />
      ) : (
        <JalaliDatePicker value={value} onChange={onChange} />
      )}
      {oppositeCaption && <p dir="ltr" className="mt-1.5 text-left text-xs text-foreground/40">{oppositeCaption}</p>}
    </div>
  );
}
