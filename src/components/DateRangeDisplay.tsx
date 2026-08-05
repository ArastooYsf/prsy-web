"use client";

import { useState } from "react";
import { formatGregorian, formatJalali } from "@/lib/jalali";

type DateRangeDisplayProps = {
  start: string;
  end?: string;
  className?: string;
};

export default function DateRangeDisplay({ start, end, className }: DateRangeDisplayProps) {
  const [calendar, setCalendar] = useState<"jalali" | "gregorian">("jalali");
  const format = calendar === "jalali" ? formatJalali : formatGregorian;

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span dir="ltr">{end ? `${format(start)} — ${format(end)}` : format(start)}</span>
      <button
        type="button"
        onClick={() => setCalendar((c) => (c === "jalali" ? "gregorian" : "jalali"))}
        className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-foreground/50 transition-colors hover:border-accent-500/40 hover:text-accent-400"
      >
        {calendar === "jalali" ? "میلادی" : "شمسی"}
      </button>
    </span>
  );
}
