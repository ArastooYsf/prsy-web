"use client";

import { JALALI_MONTHS, currentJalaliYear, daysInJalaliMonth, isoToJalali, jalaliToIso } from "@/lib/jalali";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent-500/50";

type JalaliGregorianDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  calendar: "jalali" | "gregorian";
};

export default function JalaliGregorianDateField({ label, value, onChange, calendar }: JalaliGregorianDateFieldProps) {
  if (calendar === "gregorian") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</label>
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </div>
    );
  }

  const thisYear = currentJalaliYear();
  const parsed = isoToJalali(value);
  const jy = parsed?.jy ?? thisYear;
  const jm = parsed?.jm ?? 1;
  const jd = parsed?.jd ?? 1;
  const years = Array.from({ length: 20 }, (_, i) => thisYear - 5 + i);
  const days = Array.from({ length: daysInJalaliMonth(jy, jm) }, (_, i) => i + 1);

  const update = (newJy: number, newJm: number, newJd: number) => {
    const clampedJd = Math.min(newJd, daysInJalaliMonth(newJy, newJm));
    onChange(jalaliToIso(newJy, newJm, clampedJd));
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground/80">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        <select value={jd} onChange={(e) => update(jy, jm, Number(e.target.value))} className={inputClass}>
          {days.map((d) => (
            <option key={d} value={d} className="bg-background">
              {d}
            </option>
          ))}
        </select>
        <select value={jm} onChange={(e) => update(jy, Number(e.target.value), jd)} className={inputClass}>
          {JALALI_MONTHS.map((name, i) => (
            <option key={i + 1} value={i + 1} className="bg-background">
              {name}
            </option>
          ))}
        </select>
        <select value={jy} onChange={(e) => update(Number(e.target.value), jm, jd)} className={inputClass}>
          {years.map((y) => (
            <option key={y} value={y} className="bg-background">
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
