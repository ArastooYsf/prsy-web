"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { toGregorian } from "jalaali-js";
import { CaretLeft, CaretRight, Calendar } from "@phosphor-icons/react";
import { JALALI_MONTHS, currentJalaliYear, daysInJalaliMonth, formatJalali, isoToJalali, jalaliToIso } from "@/lib/jalali";
import { useScrollIntoViewOnOpen } from "@/hooks/useScrollIntoViewOnOpen";
import { useSiteTheme } from "@/components/RouteThemeScope";
import { popoverAnimation } from "@/lib/motion";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// How many blank cells precede day 1 of (jy, jm), given the Persian week
// starts on Saturday (JS Date.getDay(): Sun=0..Sat=6 -> Sat=0..Fri=6).
function leadingEmptyCells(jy: number, jm: number): number {
  const { gy, gm, gd } = toGregorian(jy, jm, 1);
  const jsDay = new Date(gy, gm - 1, gd).getDay();
  return (jsDay + 1) % 7;
}

type JalaliDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

// Years are paged 12 at a time (matches the 12-month grid's layout), anchored
// so the current view year always falls inside the visible page.
const YEARS_PER_PAGE = 12;

export default function JalaliDatePicker({ value, onChange, placeholder }: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useScrollIntoViewOnOpen<HTMLDivElement>(open);
  // Popover.Portal renders into document.body, outside RouteThemeScope's
  // wrapper div — CSS variables only inherit through real DOM ancestry, so
  // the theme class must be reapplied here (see HeaderSearch.tsx).
  const siteTheme = useSiteTheme();
  const isLightTheme = siteTheme?.theme !== "dark";
  const thisYear = currentJalaliYear();
  const parsed = isoToJalali(value);
  const [viewYear, setViewYear] = useState(parsed?.jy ?? thisYear);
  const [viewMonth, setViewMonth] = useState(parsed?.jm ?? 1);
  // "days" is the normal calendar grid; "months"/"years" are quick-jump views
  // reached by clicking the header, so a distant date doesn't need dozens of
  // clicks on the prev/next-month arrow.
  const [pickerView, setPickerView] = useState<"days" | "months" | "years">("days");
  const [yearsPageStart, setYearsPageStart] = useState(() => (parsed?.jy ?? thisYear) - 5);

  useEffect(() => {
    if (!open) return;
    setViewYear(parsed?.jy ?? thisYear);
    setViewMonth(parsed?.jm ?? 1);
    setPickerView("days");
    setYearsPageStart((parsed?.jy ?? thisYear) - 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const days = daysInJalaliMonth(viewYear, viewMonth);
  const lead = leadingEmptyCells(viewYear, viewMonth);
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const selectDay = (d: number) => {
    onChange(jalaliToIso(viewYear, viewMonth, d));
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={placeholder ? `${placeholder}: ${value ? formatJalali(value) : "خالی"}` : undefined}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-foreground/10 bg-foreground/5 px-3 py-3 text-sm text-foreground outline-none transition-colors hover:border-foreground/20 focus:border-accent-500/50"
        >
          <span aria-hidden dir={value ? "ltr" : "rtl"} className={value ? undefined : "text-foreground/40"}>
            {value ? formatJalali(value) : placeholder}
          </span>
          <Calendar size={16} className="shrink-0 text-foreground/50" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          ref={contentRef}
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className={cn(
            "z-30 w-72 max-w-[90vw] rounded-2xl border border-foreground/10 bg-background p-3 shadow-2xl",
            isLightTheme && "theme-white-blue",
            popoverAnimation,
          )}
        >
          {pickerView === "days" && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  aria-label="ماه قبل"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setPickerView("months")}
                  className="rounded-lg px-2 py-1 text-sm font-semibold transition-colors hover:bg-foreground/10"
                >
                  {JALALI_MONTHS[viewMonth - 1]} {viewYear}
                </button>
                <button
                  type="button"
                  onClick={goNextMonth}
                  aria-label="ماه بعد"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-foreground/40">
                {WEEKDAYS.map((w, i) => (
                  <span key={i}>{w}</span>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((d, i) =>
                  d === null ? (
                    <span key={i} />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectDay(d)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors ${
                        parsed && parsed.jy === viewYear && parsed.jm === viewMonth && parsed.jd === d
                          ? "bg-accent-500 text-white"
                          : "text-foreground/80 hover:bg-foreground/10"
                      }`}
                    >
                      {d}
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {pickerView === "months" && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  aria-label="سال قبل"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYearsPageStart(viewYear - 5);
                    setPickerView("years");
                  }}
                  className="rounded-lg px-2 py-1 text-sm font-semibold transition-colors hover:bg-foreground/10"
                >
                  {viewYear}
                </button>
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  aria-label="سال بعد"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {JALALI_MONTHS.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setViewMonth(i + 1);
                      setPickerView("days");
                    }}
                    className={`rounded-lg px-2 py-2.5 text-sm transition-colors ${
                      viewMonth === i + 1 ? "bg-accent-500 text-white" : "text-foreground/80 hover:bg-foreground/10"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}

          {pickerView === "years" && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setYearsPageStart((y) => y - YEARS_PER_PAGE)}
                  aria-label="دهه‌ی قبل"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
                <span dir="ltr" className="text-sm font-semibold">
                  {yearsPageStart} – {yearsPageStart + YEARS_PER_PAGE - 1}
                </span>
                <button
                  type="button"
                  onClick={() => setYearsPageStart((y) => y + YEARS_PER_PAGE)}
                  aria-label="دهه‌ی بعد"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearsPageStart + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewYear(y);
                      setPickerView("months");
                    }}
                    className={`rounded-lg px-2 py-2.5 text-sm transition-colors ${
                      viewYear === y ? "bg-accent-500 text-white" : "text-foreground/80 hover:bg-foreground/10"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
