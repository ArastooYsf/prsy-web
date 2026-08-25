"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { formatNumber } from "@/lib/format-number";

type ImportResult = { created: number; skipped: { row: number; reason: string }[] };

export default function CsvImportForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    setResult(null);

    if (!csv.trim()) {
      showToast("محتوای CSV خالی است.", "error");
      return;
    }

    setImporting(true);
    const res = await fetch("/api/admin/customers/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    setImporting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ایمپورت.", "error");
      return;
    }

    const data: ImportResult = await res.json();
    showToast(`${formatNumber(data.created)} مشتری با موفقیت ثبت شد.`, data.skipped.length > 0 ? "warning" : "success");
    if (data.skipped.length > 0) setResult(data);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <p className="text-xs leading-6 text-foreground/50">
        فرمت هر خط: <span dir="ltr" className="font-mono text-foreground/70">نام,ایمیل,تلفن,یادداشت</span> — خط
        اول همیشه به‌عنوان سرتیتر نادیده گرفته می‌شود. مشتریان ایمپورت‌شده به‌صورت «حقیقی» و «تأییدشده» ثبت می‌شوند.
      </p>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/15 px-6 py-6 text-center transition-colors hover:border-accent-500/40">
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        <span className="text-sm font-medium text-foreground/80">برای انتخاب فایل CSV کلیک کنید</span>
        <span className="text-xs text-foreground/50">یا محتوای CSV را مستقیم پایین بچسبانید</span>
      </label>

      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={8}
        dir="ltr"
        placeholder={"name,email,phone,notes\nعلی رضایی,ali@example.com,09120000000,مشتری قدیمی از سال 1401"}
        className="w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 font-mono text-xs text-foreground placeholder:text-foreground/30 outline-none transition-colors focus:border-accent-500/50"
      />

      {result && result.skipped.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          <p>{formatNumber(result.skipped.length)} ردیف رد شد:</p>
          <ul className="mt-1 space-y-0.5 text-xs text-foreground/60">
            {result.skipped.map((s, i) => (
              <li key={i}>
                ردیف <span dir="ltr">{formatNumber(s.row)}</span>: {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={handleImport}
        disabled={importing}
        className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {importing ? "در حال ایمپورت..." : "ایمپورت CSV"}
      </button>
    </div>
  );
}
