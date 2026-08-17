"use client";

import { useEffect, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { formatGregorian } from "@/lib/jalali";

const WEEKDAYS = ["ی", "د", "س", "چ", "پ", "ج", "ش"];

const GREGORIAN_MONTHS = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "می",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
];

function daysInGregorianMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

// How many blank cells precede day 1 of (y, m) — week starts Sunday, matching
// the WEEKDAYS header order above (Date.getDay(): Sun=0..Sat=6, used as-is).
function leadingEmptyCells(y: number, m: number): number {
  return new Date(y, m - 1, 1).getDay();
}

function isoToParts(value: string): { y: number; m: number; d: number } | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function partsToIso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const YEARS_PER_PAGE = 12;

type GregorianDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

// Styled to match JalaliDatePicker exactly (same panel, same month/year
// quick-jump views) so switching calendars doesn't feel like a different app —
// see category 7 of the mobile QA pass.
export default function GregorianDatePicker({ value, onChange }: GregorianDatePickerProps) {
  const [open, setOpen] = useState(false);
  const thisYear = new Date().getFullYear();
  const parsed = isoToParts(value);
  const [viewYear, setViewYear] = useState(parsed?.y ?? thisYear);
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? 1);
  const [pickerView, setPickerView] = useState<"days" | "months" | "years">("days");
  const [yearsPageStart, setYearsPageStart] = useState(() => (parsed?.y ?? thisYear) - 5);

  useEffect(() => {
    if (!open) return;
    setViewYear(parsed?.y ?? thisYear);
    setViewMonth(parsed?.m ?? 1);
    setPickerView("days");
    setYearsPageStart((parsed?.y ?? thisYear) - 5);
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

  const days = daysInGregorianMonth(viewYear, viewMonth);
  const lead = leadingEmptyCells(viewYear, viewMonth);
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const selectDay = (d: number) => {
    onChange(partsToIso(viewYear, viewMonth, d));
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-foreground outline-none transition-colors hover:border-white/20 focus:border-accent-500/50"
        >
          <span dir="ltr">{value ? formatGregorian(value) : ""}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-foreground/50">
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className="z-30 w-72 max-w-[90vw] rounded-2xl border border-white/10 bg-background p-3 shadow-2xl"
        >
          {pickerView === "days" && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  aria-label="ماه قبل"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setPickerView("months")}
                  className="rounded-lg px-2 py-1 text-sm font-semibold transition-colors hover:bg-white/10"
                >
                  {GREGORIAN_MONTHS[viewMonth - 1]} {viewYear}
                </button>
                <button
                  type="button"
                  onClick={goNextMonth}
                  aria-label="ماه بعد"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
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
                        parsed && parsed.y === viewYear && parsed.m === viewMonth && parsed.d === d
                          ? "bg-accent-500 text-white"
                          : "text-foreground/80 hover:bg-white/10"
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
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setYearsPageStart(viewYear - 5);
                    setPickerView("years");
                  }}
                  className="rounded-lg px-2 py-1 text-sm font-semibold transition-colors hover:bg-white/10"
                >
                  {viewYear}
                </button>
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  aria-label="سال بعد"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {GREGORIAN_MONTHS.map((name, i) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setViewMonth(i + 1);
                      setPickerView("days");
                    }}
                    className={`rounded-lg px-2 py-2.5 text-sm transition-colors ${
                      viewMonth === i + 1 ? "bg-accent-500 text-white" : "text-foreground/80 hover:bg-white/10"
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
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span dir="ltr" className="text-sm font-semibold">
                  {yearsPageStart} – {yearsPageStart + YEARS_PER_PAGE - 1}
                </span>
                <button
                  type="button"
                  onClick={() => setYearsPageStart((y) => y + YEARS_PER_PAGE)}
                  aria-label="دهه‌ی بعد"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
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
                      viewYear === y ? "bg-accent-500 text-white" : "text-foreground/80 hover:bg-white/10"
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
