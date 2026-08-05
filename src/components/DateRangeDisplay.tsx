"use client";

import { useState } from "react";
import { formatGregorian, formatJalali } from "@/lib/jalali";
import ToggleSwitch from "@/components/ToggleSwitch";

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
      <ToggleSwitch
        checked={calendar === "jalali"}
        onChange={(v) => setCalendar(v ? "jalali" : "gregorian")}
        onLabel="شمسی"
        offLabel="میلادی"
      />
    </span>
  );
}
