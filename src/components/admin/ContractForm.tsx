"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ContractFileUploadField from "@/components/admin/ContractFileUploadField";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type Customer = { id: string; label: string };

type ContractFormProps = {
  mode: "create" | "edit";
  customers: Customer[];
  contract?: {
    id: string;
    userId: string;
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    fileUrl: string | null;
  };
};

export default function ContractForm({ mode, customers, contract }: ContractFormProps) {
  const router = useRouter();

  const [userId, setUserId] = useState(contract?.userId ?? customers[0]?.id ?? "");
  const [title, setTitle] = useState(contract?.title ?? "");
  const [type, setType] = useState(contract?.type ?? "");
  const [startDate, setStartDate] = useState(contract?.startDate.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(contract?.endDate.slice(0, 10) ?? "");
  const [status, setStatus] = useState(contract?.status ?? "ACTIVE");
  const [fileUrl, setFileUrl] = useState(contract?.fileUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId || !title.trim() || !type.trim() || !startDate || !endDate) {
      setError("همه فیلدهای الزامی را پر کنید.");
      return;
    }

    setSaving(true);

    const payload = { userId, title, type, startDate, endDate, status, fileUrl: fileUrl || null };

    const res = await fetch(
      mode === "create" ? "/api/admin/contracts" : `/api/admin/contracts/${contract!.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در ذخیره قرارداد.");
      return;
    }

    router.push("/admin/contracts");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">مشتری</label>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} className={inputClass}>
          {customers.map((c) => (
            <option key={c.id} value={c.id} className="bg-background">
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان قرارداد</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">نوع قرارداد</label>
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={inputClass}
          placeholder="مثلاً گارانتی و نگهداری"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">تاریخ شروع</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">تاریخ پایان</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">وضعیت</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          <option value="ACTIVE" className="bg-background">فعال</option>
          <option value="EXPIRED" className="bg-background">منقضی‌شده</option>
        </select>
      </div>

      <ContractFileUploadField value={fileUrl} onChange={setFileUrl} />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره"}
      </button>
    </form>
  );
}
