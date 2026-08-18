"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, ChevronDown, Download, Lock, ShieldAlert, Unlock } from "lucide-react";
import { isoToJalali } from "@/lib/jalali";
import JalaliDatePicker from "@/components/admin/JalaliDatePicker";
import { useToast } from "@/components/ToastProvider";
import type { LogCategory, LogFileSummary } from "@/lib/logger";

type LogsExplorerProps = {
  files: LogFileSummary[];
};

const CATEGORY_META: Record<LogCategory, { label: string; className: string; icon: typeof AlertTriangle | null }> = {
  general: { label: "عادی", className: "border-white/10 bg-white/5 text-foreground/60", icon: null },
  crash: { label: "کرش", className: "border-red-500/30 bg-red-500/10 text-red-400", icon: AlertTriangle },
  security: { label: "امنیتی", className: "border-amber-500/30 bg-amber-500/10 text-amber-400", icon: ShieldAlert },
  notification: { label: "اعلان", className: "border-brand-400/30 bg-brand-400/10 text-brand-300", icon: Bell },
};

const CATEGORY_FILTERS: { value: "all" | LogCategory; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "general", label: "عادی" },
  { value: "crash", label: "کرش" },
  { value: "security", label: "امنیتی" },
  { value: "notification", label: "اعلان" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
}

function jalaliKeyFromFilename(filename: string): string {
  return filename.replace(/\.log$/, "");
}

function jalaliKeyFromIso(iso: string): string | null {
  const j = isoToJalali(iso);
  if (!j) return null;
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
}

export default function LogsExplorer({ files }: LogsExplorerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<"all" | LogCategory>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [entriesCache, setEntriesCache] = useState<Record<string, string[]>>({});
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [togglingLock, setTogglingLock] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const fromKey = fromDate ? jalaliKeyFromIso(fromDate) : null;
    const toKey = toDate ? jalaliKeyFromIso(toDate) : null;

    return files.filter((f) => {
      if (categoryFilter !== "all" && !f.categories.includes(categoryFilter)) return false;
      const key = jalaliKeyFromFilename(f.filename);
      if (fromKey && key < fromKey) return false;
      if (toKey && key > toKey) return false;
      return true;
    });
  }, [files, categoryFilter, fromDate, toDate]);

  const toggleExpand = async (filename: string) => {
    if (expanded === filename) {
      setExpanded(null);
      return;
    }
    setExpanded(filename);

    if (entriesCache[filename]) return;

    setLoadingFile(filename);
    const res = await fetch(`/api/admin/logs/${filename}`);
    setLoadingFile(null);

    if (!res.ok) {
      showToast("خطا در بارگذاری محتوای این روز.", "error");
      return;
    }

    const body = await res.json();
    setEntriesCache((prev) => ({ ...prev, [filename]: body.lines ?? [] }));
  };

  const toggleLock = async (filename: string, currentlyLocked: boolean) => {
    setTogglingLock(filename);

    const res = await fetch(`/api/admin/logs/${filename}/lock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked: !currentlyLocked }),
    });

    setTogglingLock(null);

    if (!res.ok) {
      showToast("خطا در تغییر وضعیت قفل.", "error");
      return;
    }

    showToast(currentlyLocked ? "قفل فایل باز شد." : "فایل قفل شد.");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategoryFilter(c.value)}
              className={`inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
                categoryFilter === c.value
                  ? "border-accent-500/40 bg-accent-500/10 text-accent-400"
                  : "border-white/10 text-foreground/60 hover:border-white/20"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mr-auto flex flex-wrap items-center gap-2">
          <div className="w-36">
            <JalaliDatePicker value={fromDate} onChange={setFromDate} />
          </div>
          <span className="text-xs text-foreground/40">تا</span>
          <div className="w-36">
            <JalaliDatePicker value={toDate} onChange={setToDate} />
          </div>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="text-xs text-foreground/50 underline decoration-dotted hover:text-foreground/80"
            >
              پاک کردن بازه
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-foreground/50">
          هیچ فایل لاگی با این فیلتر یافت نشد.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const isOpen = expanded === f.filename;
            return (
              <div key={f.filename} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(f.filename)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleExpand(f.filename);
                    }
                  }}
                  className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-right outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50"
                >
                  <ChevronDown
                    className={`size-4 shrink-0 text-foreground/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                  <span dir="ltr" className="font-mono text-sm font-medium text-foreground/80">
                    {jalaliKeyFromFilename(f.filename)}
                  </span>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {f.categories.map((cat) => {
                      const meta = CATEGORY_META[cat];
                      const Icon = meta.icon;
                      return (
                        <span
                          key={cat}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}
                        >
                          {Icon && <Icon className="size-3" />}
                          {meta.label}
                        </span>
                      );
                    })}
                  </div>

                  <span className="text-xs text-foreground/50">{f.entryCount.toLocaleString("fa-IR")} رویداد</span>
                  <span className="text-xs text-foreground/40">{formatSize(f.size)}</span>

                  {f.locked && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                      <Lock className="size-3" />
                      قفل‌شده
                    </span>
                  )}

                  <div className="mr-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={togglingLock === f.filename}
                      onClick={() => toggleLock(f.filename, f.locked)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-white/10 px-3 text-[11px] font-medium text-foreground/70 transition-colors hover:border-white/20 disabled:opacity-50"
                    >
                      {f.locked ? <Unlock className="size-3" /> : <Lock className="size-3" />}
                      {f.locked ? "باز کردن قفل" : "قفل کردن"}
                    </button>
                    <a
                      href={`/api/admin/logs/${f.filename}/download`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-white/10 px-3 text-[11px] font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                    >
                      <Download className="size-3" />
                      دانلود
                    </a>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-white/10 bg-black/10 px-4 py-3">
                    {loadingFile === f.filename ? (
                      <p className="text-xs text-foreground/50">در حال بارگذاری...</p>
                    ) : entriesCache[f.filename]?.length ? (
                      <ul className="space-y-1.5 text-xs leading-6 text-foreground/70">
                        {entriesCache[f.filename].map((line, i) => (
                          <li key={i} dir="rtl" className="border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                            {line}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-foreground/50">این فایل روزانه هیچ رویدادی ندارد.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
