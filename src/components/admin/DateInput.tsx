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
      {calendar === "gregorian" ? (
        <GregorianDatePicker value={value} onChange={onChange} placeholder={label} />
      ) : (
        <JalaliDatePicker value={value} onChange={onChange} placeholder={label} />
      )}
      {/* Toggle sits directly under the field, flush to its right edge (first
          in DOM = right-most in this RTL layout). min-h-11 is reserved even
          when hideToggle hides the button, so a hideToggle sibling (e.g. the
          "تا" half of a از/تا pair) keeps the same total field height as the
          one showing the toggle — otherwise paired fields drift out of
          alignment. Real (uncancelled) height, not negative-margin — it sits
          below the field now, so an invisible oversized hit area here would
          overlap whatever comes after this field instead of the field itself. */}
      <div className="mt-1.5 flex items-start justify-between gap-2">
        {hideToggle ? (
          <span aria-hidden className="min-h-11 shrink-0" />
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={calendar === "jalali"}
            onClick={() => setCalendar(calendar === "jalali" ? "gregorian" : "jalali")}
            aria-label={`تقویم ${calendar === "jalali" ? "شمسی" : "میلادی"} — برای تغییر کلیک کنید`}
            title="تغییر تقویم"
            className="inline-flex min-h-11 shrink-0 items-center gap-0.5 rounded-full px-2 text-[11px] font-medium text-foreground/40 transition-colors hover:text-accent-400"
          >
            <ArrowLeftRight className="size-3" />
            {calendar === "jalali" ? "شمسی" : "میلادی"}
          </button>
        )}
        {oppositeCaption && (
          <p dir="ltr" className="pt-2.5 text-left text-xs text-foreground/40">
            {oppositeCaption}
          </p>
        )}
      </div>
    </div>
  );
}
