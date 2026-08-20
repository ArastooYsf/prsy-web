"use client";

import { useState } from "react";
import { formatGregorian, formatJalali } from "@/lib/jalali";
import JalaliDatePicker from "@/components/admin/JalaliDatePicker";
import GregorianDatePicker from "@/components/admin/GregorianDatePicker";
import ToggleSwitch from "@/components/ToggleSwitch";

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
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {label && <label className="text-sm font-medium text-foreground/80">{label}</label>}
          {!hideToggle && (
            <ToggleSwitch
              checked={calendar === "jalali"}
              onChange={(v) => setCalendar(v ? "jalali" : "gregorian")}
              onLabel="شمسی"
              offLabel="میلادی"
              className="mr-auto min-h-0"
            />
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
