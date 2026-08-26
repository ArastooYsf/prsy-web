"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Lock, Unlock } from "lucide-react";
import { isoToJalali } from "@/lib/jalali";
import { toPersianDigits, formatNumber } from "@/lib/format-number";
import DateInput, { type Calendar } from "@/components/admin/DateInput";
import ToggleSwitch from "@/components/ToggleSwitch";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { CATEGORY_META, CategoryBadge } from "@/components/admin/log-category-meta";
import { triggerBlobDownload } from "@/lib/blob-download";
import type { LogFileSummary } from "@/lib/logger";
import { ALL_LOG_CATEGORIES, type LogCategory } from "@/lib/log-types";

type LogsExplorerProps = {
  files: LogFileSummary[];
};

// "این دسته همیشه از لحظه‌ی ساخت قفل است" — shown in the unlock-confirm
// dialog for these two, since opening their lock removes a guarantee the
// system gave them automatically, not one an admin set by hand.
const ALWAYS_LOCKED_BY_DEFAULT: readonly LogCategory[] = ["crash", "security"];

// A busy-state key that can never collide with a real filename (all real
// ones end in ".log"), so one `downloading` atom can track either a
// single-file or the category-wide download.
const DOWNLOADING_CATEGORY = "__category__";

function formatSize(bytes: number) {
  if (bytes < 1024) return toPersianDigits(`${bytes} بایت`);
  if (bytes < 1024 * 1024) return toPersianDigits(`${Math.round(bytes / 1024)} کیلوبایت`);
  return toPersianDigits(`${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`);
}

// Strips the "${category}-" prefix and ".log" suffix, leaving either
// "1404-06-03" (daily file) or "1404-06-03T14-32-05" (event file — see
// resolveEventFilename in logger.ts).
function dateTimeKeyFromFilename(filename: string, category: string): string {
  return filename.replace(new RegExp(`^${category}-`), "").replace(/\.log$/, "");
}

// Only the date portion, for comparing against the from/to range filter —
// an event file's embedded time must not push it outside its own day.
function dateOnlyKey(filename: string, category: string): string {
  return dateTimeKeyFromFilename(filename, category).split("T")[0];
}

// "1404-06-03T14-32-05" -> "1404-06-03 14:32:05"; a daily key passes through as-is.
function formatFileDateTime(key: string): string {
  const [datePart, timePart] = key.split("T");
  return timePart ? `${datePart} ${timePart.replace(/-/g, ":")}` : datePart;
}

function jalaliKeyFromIso(iso: string): string | null {
  const j = isoToJalali(iso);
  if (!j) return null;
  return `${j.jy}-${String(j.jm).padStart(2, "0")}-${String(j.jd).padStart(2, "0")}`;
}

// Shared by the mobile card and desktop table rows — same button, same
// behavior, only the surrounding layout differs.
function DownloadButton({ filename, downloading, onDownload }: { filename: string; downloading: boolean; onDownload: (filename: string) => void }) {
  return (
    <button
      type="button"
      disabled={downloading}
      onClick={(e) => {
        e.stopPropagation();
        onDownload(filename);
      }}
      aria-label="دانلود zip رمزدار این فایل"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-foreground/10 text-foreground/60 transition-colors hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="size-3.5" />
    </button>
  );
}

export default function LogsExplorer({ files }: LogsExplorerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  // Empty = "all categories" (matches the "همه" chip). Multi-select instead
  // of the old single-value radio-button-style filter, so an admin can e.g.
  // filter "امنیتی + کرش" together.
  const [selectedCategories, setSelectedCategories] = useState<LogCategory[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [calendar, setCalendar] = useState<Calendar>("jalali");
  const [togglingLock, setTogglingLock] = useState<string | null>(null);
  // The file pending an unlock confirmation — locking never needs this,
  // only opening a lock does (it's the sensitive direction).
  const [unlockTarget, setUnlockTarget] = useState<LogFileSummary | null>(null);
  // Holds a filename, DOWNLOADING_CATEGORY, or null — one atom drives both
  // the per-row spinner and the category-button spinner, since only one
  // download can be in flight from this component at a time anyway.
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const fromKey = fromDate ? jalaliKeyFromIso(fromDate) : null;
    const toKey = toDate ? jalaliKeyFromIso(toDate) : null;

    return files.filter((f) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(f.category)) return false;
      const key = dateOnlyKey(f.filename, f.category);
      if (fromKey && key < fromKey) return false;
      if (toKey && key > toKey) return false;
      return true;
    });
  }, [files, selectedCategories, fromDate, toDate]);

  const toggleCategory = (cat: LogCategory) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const setLocked = async (filename: string, locked: boolean) => {
    setTogglingLock(filename);

    const res = await fetch(`/api/admin/logs/${filename}/lock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked }),
    });

    setTogglingLock(null);

    if (!res.ok) {
      showToast("خطا در تغییر وضعیت قفل.", "error");
      return;
    }

    showToast(locked ? "فایل قفل شد." : "قفل فایل باز شد.");
    router.refresh();
  };

  // Locking is safe and reversible — do it immediately. Unlocking removes a
  // protection (for crash/security, one the system set automatically), so
  // it goes through a confirm dialog first instead of firing on one click.
  const handleLockClick = (f: LogFileSummary) => {
    if (f.locked) {
      setUnlockTarget(f);
    } else {
      void setLocked(f.filename, true);
    }
  };

  const openFile = (filename: string) => {
    router.push(`/account/admin/logs/${encodeURIComponent(filename)}`);
  };

  // The export endpoint returns the ZIP bytes directly rather than a
  // redirect/link, so a plain <a href> can't be used — fetch + blob lets us
  // show a busy state on the triggering button and surface a toast instead
  // of a bare error page if the export fails (e.g. 7z missing). Shared by
  // both the per-row and the category download button — they differ only
  // in the URL, the busy-state key, and the fallback filename.
  const runZipDownload = async (url: string, fallbackName: string, busyKey: string) => {
    setDownloading(busyKey);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        showToast(body?.error ?? "دانلود فایل ناموفق بود.", "error");
        return;
      }

      const usedPlaceholderPassword = res.headers.get("X-Log-Export-Placeholder-Password") === "1";
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const name = disposition.match(/filename="([^"]+)"/)?.[1] ?? fallbackName;
      triggerBlobDownload(blob, name);

      // LOG_EXPORT_PASSWORD isn't set — the zip is still AES-256 encrypted,
      // but with the placeholder baked into the source, not a secret only
      // this admin knows. Surface it every time rather than once, since a
      // silently-unprotected export is exactly the failure mode to avoid.
      if (usedPlaceholderPassword) {
        showToast("توجه: LOG_EXPORT_PASSWORD تنظیم نشده — این فایل با رمز پیش‌فرض placeholder رمزنگاری شد، نه یک رمز واقعی.", "error");
      }
    } catch {
      showToast("دانلود فایل ناموفق بود.", "error");
    } finally {
      setDownloading(null);
    }
  };

  const downloadFile = (filename: string) =>
    runZipDownload(`/api/admin/logs/export?filename=${encodeURIComponent(filename)}`, `${filename}.zip`, filename);

  const downloadCategory = () => {
    const categoryParam = selectedCategories.length > 0 ? selectedCategories.join(",") : "all";
    runZipDownload(`/api/admin/logs/export?category=${categoryParam}`, `logs-${categoryParam}-export.zip`, DOWNLOADING_CATEGORY);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategories([])}
            className={`inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
              selectedCategories.length === 0
                ? "border-accent-500/40 bg-accent-500/10 text-accent-400"
                : "border-foreground/10 text-foreground/60 hover:border-foreground/20"
            }`}
          >
            همه
          </button>
          {ALL_LOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              aria-pressed={selectedCategories.includes(cat)}
              className={`inline-flex min-h-11 items-center rounded-full border px-3 text-xs font-medium transition-colors ${
                selectedCategories.includes(cat)
                  ? "border-accent-500/40 bg-accent-500/10 text-accent-400"
                  : "border-foreground/10 text-foreground/60 hover:border-foreground/20"
              }`}
            >
              {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>

        <div className="mr-auto flex flex-col gap-1.5">
          <div className="flex justify-end">
            <ToggleSwitch
              checked={calendar === "jalali"}
              onChange={(v) => setCalendar(v ? "jalali" : "gregorian")}
              onLabel="شمسی"
              offLabel="میلادی"
              className="min-h-0"
            />
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <div className="w-36">
              <DateInput label="از" value={fromDate} onChange={setFromDate} calendar={calendar} onCalendarChange={setCalendar} hideToggle />
            </div>
            <div className="w-36">
              <DateInput label="تا" value={toDate} onChange={setToDate} calendar={calendar} onCalendarChange={setCalendar} hideToggle />
            </div>
            {(fromDate || toDate) && (
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="self-center text-xs text-foreground/50 underline decoration-dotted hover:text-foreground/80"
              >
                پاک کردن بازه
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={downloadCategory}
          disabled={downloading === DOWNLOADING_CATEGORY}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-3.5 text-xs font-medium text-foreground/70 transition-colors hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-3.5" />
          {downloading === DOWNLOADING_CATEGORY
            ? "در حال آماده‌سازی zip..."
            : selectedCategories.length === 0
              ? "دانلود همه‌ی فایل‌ها (zip رمزدار)"
              : `دانلود فایل‌های «${selectedCategories.map((c) => CATEGORY_META[c].label).join("، ")}» (zip رمزدار)`}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6 text-center text-sm text-foreground/50">
          هیچ فایل لاگی با این فیلتر یافت نشد.
        </p>
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-2 md:hidden">
            {filtered.map((f) => (
              <div
                key={f.filename}
                role="button"
                tabIndex={0}
                onClick={() => openFile(f.filename)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openFile(f.filename);
                  }
                }}
                className="cursor-pointer rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 outline-none transition-colors hover:border-accent-500/30 focus-visible:ring-2 focus-visible:ring-accent-500/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span dir="ltr" className="font-mono text-sm font-medium text-foreground/80">
                    {formatFileDateTime(dateTimeKeyFromFilename(f.filename, f.category))}
                  </span>
                  <CategoryBadge category={f.category} />
                </div>
                <dl className="mt-3 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-foreground/50">{formatNumber(f.entryCount)} رویداد</span>
                    <span className="text-foreground/40">{formatSize(f.size)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DownloadButton filename={f.filename} downloading={downloading === f.filename} onDownload={downloadFile} />
                    <button
                      type="button"
                      disabled={togglingLock === f.filename}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockClick(f);
                      }}
                      aria-label={f.locked ? "باز کردن قفل فایل" : "قفل کردن فایل"}
                      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        f.locked
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          : "border-foreground/10 text-foreground/60 hover:border-foreground/20"
                      }`}
                    >
                      {f.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                      {f.locked ? "قفل‌شده" : "باز"}
                    </button>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden rounded-2xl border border-foreground/10 md:block">
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="rounded-tr-2xl bg-background px-4 py-3 text-right font-medium">تاریخ</th>
                  <th className="bg-background px-4 py-3 text-right font-medium">دسته</th>
                  <th className="bg-background px-4 py-3 text-right font-medium">حجم</th>
                  <th className="bg-background px-4 py-3 text-right font-medium">تعداد رویداد</th>
                  <th className="bg-background px-4 py-3 text-right font-medium">قفل</th>
                  <th className="rounded-tl-2xl bg-background px-4 py-3 text-right font-medium">دانلود</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.filename}
                    role="button"
                    tabIndex={0}
                    onClick={() => openFile(f.filename)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openFile(f.filename);
                      }
                    }}
                    className="cursor-pointer border-t border-foreground/10 outline-none transition-colors hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.03]"
                  >
                    <td dir="ltr" className="px-4 py-3 text-right font-mono text-xs text-foreground/80">
                      {formatFileDateTime(dateTimeKeyFromFilename(f.filename, f.category))}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={f.category} />
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/50">{formatSize(f.size)}</td>
                    <td className="px-4 py-3 text-xs text-foreground/50">{formatNumber(f.entryCount)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        disabled={togglingLock === f.filename}
                        onClick={() => handleLockClick(f)}
                        aria-label={f.locked ? "باز کردن قفل فایل" : "قفل کردن فایل"}
                        className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          f.locked
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            : "border-foreground/10 text-foreground/60 hover:border-foreground/20"
                        }`}
                      >
                        {f.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                        {f.locked ? "قفل‌شده" : "باز"}
                      </button>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DownloadButton filename={f.filename} downloading={downloading === f.filename} onDownload={downloadFile} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!unlockTarget}
        title="باز کردن قفل فایل؟"
        message={
          unlockTarget
            ? `فایل «${formatFileDateTime(dateTimeKeyFromFilename(unlockTarget.filename, unlockTarget.category))}» (${CATEGORY_META[unlockTarget.category].label}) پس از باز شدن قفل، در صورت پر شدن حجم دایرکتوری لاگ‌ها ممکن است به‌صورت خودکار حذف شود.${
                ALWAYS_LOCKED_BY_DEFAULT.includes(unlockTarget.category)
                  ? " این فایل جزو دسته‌هایی است که همیشه از لحظه‌ی ساخت به‌صورت خودکار قفل می‌شوند — باز کردن دستی این محافظت را برای همین فایل برمی‌دارد."
                  : ""
              }`
            : ""
        }
        confirmLabel="باز کردن قفل"
        danger
        loading={!!unlockTarget && togglingLock === unlockTarget.filename}
        onConfirm={async () => {
          if (!unlockTarget) return;
          await setLocked(unlockTarget.filename, false);
          setUnlockTarget(null);
        }}
        onCancel={() => setUnlockTarget(null)}
      />
    </div>
  );
}
