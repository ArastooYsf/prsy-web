"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { formatGregorian, formatJalali } from "@/lib/jalali";
import JalaliDatePicker from "@/components/admin/JalaliDatePicker";
import GregorianDatePicker from "@/components/admin/GregorianDatePicker";

export type Calendar = "jalali" | "gregorian";

type DateInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Lift calendar state to a parent when several fields (e.g. a start/end pair)
   * should switch calendars together under one shared toggle. Uncontrolled
   * (self-managed) by default, which is the right choice for a standalone field. */
  calendar?: Calendar;
  onCalendarChange?: (calendar: Calendar) => void;
  /** Hide this instance's own toggle — used together with a controlled `calendar`
   * when a parent renders one shared toggle for a group of fields. */
  hideToggle?: boolean;
};

export default function DateInput({ label, value, onChange, calendar: calendarProp, onCalendarChange, hideToggle }: DateInputProps) {
  const [internalCalendar, setInternalCalendar] = useState<Calendar>("jalali");
  const calendar = calendarProp ?? internalCalendar;
  const setCalendar = onCalendarChange ?? setInternalCalendar;

  const oppositeCaption = value ? (calendar === "jalali" ? formatGregorian(value) : formatJalali(value)) : null;

  return (
    <div>
      {(label || !hideToggle) && (
        // min-h-12 matches the toggle button's own real height (see below) —
        // applied unconditionally so a hideToggle sibling's plain label row
        // reserves the same space, keeping paired fields (از/تا, شروع/پایان)
        // aligned instead of only the one with a visible toggle growing taller.
        <div className="mb-1.5 flex min-h-12 items-center gap-1">
          {label && <label className="text-sm font-medium text-foreground/80">{label}</label>}
          {!hideToggle && (
            // Compact inline toggle next to the label instead of a full-height
            // switch on its own row — a separate row (like the ToggleSwitch
            // this replaced) makes this field noticeably taller than plain
            // siblings in the same form row. Vertical padding is real (not
            // negative-margin-cancelled): an invisible oversized hit area
            // would silently overlap whatever sits a few px below (the date
            // picker trigger) or above, stealing its taps. Horizontal padding
            // stays negative-margin-cancelled — there's no interactive
            // neighbor to the side, only label text, so widening the row's
            // flow footprint there would just wrap the label for nothing.
            <button
              type="button"
              role="switch"
              aria-checked={calendar === "jalali"}
              onClick={() => setCalendar(calendar === "jalali" ? "gregorian" : "jalali")}
              aria-label={`تقویم ${calendar === "jalali" ? "شمسی" : "میلادی"} — برای تغییر کلیک کنید`}
              title="تغییر تقویم"
              className="-mx-4 flex items-center gap-0.5 rounded-full px-4 py-4 text-[11px] font-medium text-foreground/40 transition-colors hover:text-accent-400"
            >
              <ArrowLeftRight className="size-3" />
              {calendar === "jalali" ? "شمسی" : "میلادی"}
            </button>
          )}
        </div>
      )}
      {calendar === "gregorian" ? (
        <GregorianDatePicker value={value} onChange={onChange} />
      ) : (
        <JalaliDatePicker value={value} onChange={onChange} />
      )}
      {oppositeCaption && (
        <p dir="ltr" className="mt-1.5 text-left text-xs text-foreground/40">
          {oppositeCaption}
        </p>
      )}
    </div>
  );
}
