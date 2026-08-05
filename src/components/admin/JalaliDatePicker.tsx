"use client";

import { useEffect, useRef, useState } from "react";
import { toGregorian } from "jalaali-js";
import { JALALI_MONTHS, currentJalaliYear, daysInJalaliMonth, formatJalali, isoToJalali, jalaliToIso } from "@/lib/jalali";

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
};

export default function JalaliDatePicker({ value, onChange }: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const thisYear = currentJalaliYear();
  const parsed = isoToJalali(value);
  const [viewYear, setViewYear] = useState(parsed?.jy ?? thisYear);
  const [viewMonth, setViewMonth] = useState(parsed?.jm ?? 1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setViewYear(parsed?.jy ?? thisYear);
    setViewMonth(parsed?.jm ?? 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-foreground outline-none transition-colors hover:border-white/20 focus:border-accent-500/50"
      >
        <span dir="ltr">{value ? formatJalali(value) : ""}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-foreground/50">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 rounded-2xl border border-white/10 bg-background p-3 shadow-2xl">
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
            <span className="text-sm font-semibold">
              {JALALI_MONTHS[viewMonth - 1]} {viewYear}
            </span>
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
                    parsed && parsed.jy === viewYear && parsed.jm === viewMonth && parsed.jd === d
                      ? "bg-accent-500 text-white"
                      : "text-foreground/80 hover:bg-white/10"
                  }`}
                >
                  {d}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
