"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { toPersianDigits, formatNumber } from "@/lib/format-number";
import { ACTION_LABELS_FA, type LogCategory, type LogEntry } from "@/lib/log-types";
import { CATEGORY_META } from "@/components/admin/log-category-meta";

type LogFileDetailProps = {
  category: LogCategory;
  entries: LogEntry[];
};

// Fields already rendered explicitly elsewhere in the row/panel — "ip" and
// "userAgent" are deliberately NOT here: they have no dedicated JSX of
// their own, they render through the generic extraEntries fallback below
// (via EXTRA_KEY_LABELS) alongside anything else a future producer adds
// (requestId, deviceId, ...), instead of silently disappearing.
const KNOWN_KEYS = new Set(["timestamp", "category", "actor", "action", "target", "summary"]);

const EXTRA_KEY_LABELS: Record<string, string> = {
  ip: "آدرس IP",
  userAgent: "User Agent",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return toPersianDigits(`${hh}:${mm}:${ss}`);
}

function timeOfDay(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function LogFileDetail({ category, entries }: LogFileDetailProps) {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<"all" | LogEntry["action"]>("all");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const actionOptions = useMemo(() => {
    const seen = new Set(entries.map((e) => e.action));
    return Array.from(seen).sort((a, b) => (ACTION_LABELS_FA[a] ?? a).localeCompare(ACTION_LABELS_FA[b] ?? b));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => {
        if (actionFilter !== "all" && entry.action !== actionFilter) return false;
        if (q) {
          const haystack = `${entry.actor.name ?? ""} ${entry.actor.email} ${entry.target.label}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        const hm = timeOfDay(entry.timestamp);
        if (fromTime && hm < fromTime) return false;
        if (toTime && hm > toTime) return false;
        return true;
      });
  }, [entries, actionFilter, query, fromTime, toTime]);

  const toggleExpand = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const tint = CATEGORY_META[category].tintClassName;
  const hasActiveFilters = !!query || actionFilter !== "all" || !!fromTime || !!toTime;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
        <div className="relative min-w-0 flex-1 basis-56">
          <label className="mb-1.5 block text-xs font-medium text-foreground/50">جست‌وجوی کاربر یا موجودیت</label>
          <Search className="pointer-events-none absolute right-3 top-[calc(50%+0.5rem)] size-4 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="نام، ایمیل یا عنوان موجودیت..."
            className="min-h-11 w-full rounded-lg border border-foreground/10 bg-foreground/5 py-2 pl-3 pr-9 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-accent-500/50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/50">نوع عملیات</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as "all" | LogEntry["action"])}
            className="min-h-11 rounded-lg border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground outline-none transition-colors focus:border-accent-500/50"
          >
            <option value="all">نوع عملیات: همه</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABELS_FA[a] ?? a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/50">از ساعت</label>
          <input
            type="time"
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            className="min-h-11 rounded-lg border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground outline-none transition-colors focus:border-accent-500/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/50">تا ساعت</label>
          <input
            type="time"
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            className="min-h-11 rounded-lg border border-foreground/10 bg-foreground/5 px-3 text-sm text-foreground outline-none transition-colors focus:border-accent-500/50"
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActionFilter("all");
              setFromTime("");
              setToTime("");
            }}
            className="mb-0.5 self-end text-xs text-foreground/50 underline decoration-dotted hover:text-foreground/80"
          >
            پاک‌کردن فیلترها
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-8 text-center text-sm text-foreground/50">
          این فایل هیچ رویدادی ندارد.
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-8 text-center text-sm text-foreground/50">
          هیچ رویدادی با این فیلتر یافت نشد.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-foreground/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-foreground/60">
              <tr>
                <th className="w-10 rounded-tr-2xl bg-background px-3 py-3"></th>
                <th className="bg-background px-4 py-3 text-right font-medium">زمان</th>
                <th className="bg-background px-4 py-3 text-right font-medium">نوع عملیات</th>
                <th className="bg-background px-4 py-3 text-right font-medium">کاربر انجام‌دهنده</th>
                <th className="rounded-tl-2xl bg-background px-4 py-3 text-right font-medium">موجودیت هدف</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ entry, index }) => {
                const isOpen = expanded.has(index);
                const extraEntries = Object.entries(entry).filter(([key, value]) => !KNOWN_KEYS.has(key) && value != null);

                return (
                  <Fragment key={index}>
                    <tr
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleExpand(index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpand(index);
                        }
                      }}
                      className={`cursor-pointer border-t border-foreground/10 outline-none transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.04] ${tint}`}
                    >
                      <td className="px-3 py-3.5">
                        <ChevronDown className={`size-4 text-foreground/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </td>
                      <td dir="ltr" className="px-4 py-3.5 text-right font-mono text-xs text-foreground/80">
                        {formatTime(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3.5 text-foreground/80">{ACTION_LABELS_FA[entry.action] ?? entry.action}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-foreground/80">{entry.actor.name || entry.actor.email || "کاربر ناشناس"}</span>
                        <span className="mr-1.5 text-xs text-foreground/40">({entry.actor.role})</span>
                      </td>
                      <td className="px-4 py-3.5 text-foreground/70">{entry.target.label}</td>
                    </tr>

                    {isOpen && (
                      <tr className={`border-t border-foreground/5 ${tint}`}>
                        <td colSpan={5} className="px-4 py-5 sm:px-10">
                          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-xs leading-6 sm:grid-cols-2">
                            <div className="flex items-baseline gap-2">
                              <dt className="shrink-0 text-foreground/40">ایمیل کاربر</dt>
                              <dd dir="ltr" className="text-right text-foreground/70">
                                {entry.actor.email || "—"}
                              </dd>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <dt className="shrink-0 text-foreground/40">شناسه کاربر</dt>
                              <dd dir="ltr" className="text-right font-mono text-foreground/70">
                                {entry.actor.id}
                              </dd>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <dt className="shrink-0 text-foreground/40">نوع موجودیت</dt>
                              <dd className="text-right text-foreground/70">{entry.target.type}</dd>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <dt className="shrink-0 text-foreground/40">شناسه موجودیت</dt>
                              <dd dir="ltr" className="text-right font-mono text-foreground/70">
                                {entry.target.id}
                              </dd>
                            </div>
                            {extraEntries.map(([key, value]) => (
                              <div key={key} className="flex items-baseline gap-2">
                                <dt className="shrink-0 text-foreground/40">{EXTRA_KEY_LABELS[key] ?? key}</dt>
                                <dd dir="ltr" className="break-all text-right text-foreground/70">
                                  {String(value)}
                                </dd>
                              </div>
                            ))}
                            {entry.summary && (
                              <div className="col-span-full flex flex-col gap-1.5 border-t border-foreground/5 pt-3">
                                <dt className="text-foreground/40">توضیحات کامل</dt>
                                <dd className="leading-7 text-foreground/80">{entry.summary}</dd>
                              </div>
                            )}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-foreground/40">
        {formatNumber(filtered.length)} از {formatNumber(entries.length)} رویداد نمایش داده می‌شود.
      </p>
    </div>
  );
}
