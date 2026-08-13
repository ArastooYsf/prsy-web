"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ContractFileUploadField from "@/components/admin/ContractFileUploadField";
import JalaliGregorianDateField from "@/components/admin/JalaliGregorianDateField";
import ToggleSwitch from "@/components/ToggleSwitch";
import { CONTRACT_STATUS } from "@/lib/status-labels";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

const CUSTOM_TYPE_VALUE = "__custom__";

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
  const [contractTypes, setContractTypes] = useState<string[]>([]);
  const [typeOption, setTypeOption] = useState(contract?.type ?? "");
  const [customType, setCustomType] = useState("");
  const [startDate, setStartDate] = useState(contract?.startDate.slice(0, 10) ?? "");
  const [endDate, setEndDate] = useState(contract?.endDate.slice(0, 10) ?? "");
  const [calendar, setCalendar] = useState<"jalali" | "gregorian">("jalali");
  const [status, setStatus] = useState(contract?.status ?? "ACTIVE");
  const [fileUrl, setFileUrl] = useState(contract?.fileUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/contract-types")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const types: string[] = data.types;
        setContractTypes(types);

        if (contract?.type) {
          if (types.includes(contract.type)) {
            setTypeOption(contract.type);
          } else {
            setTypeOption(CUSTOM_TYPE_VALUE);
            setCustomType(contract.type);
          }
        } else if (!contract && types.length > 0) {
          setTypeOption(types[0]);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const finalType = typeOption === CUSTOM_TYPE_VALUE ? customType.trim() : typeOption;

    if (!userId || !title.trim() || !finalType || !startDate || !endDate) {
      setError("همه فیلدهای الزامی را پر کنید.");
      return;
    }

    setSaving(true);

    const payload = { userId, title, type: finalType, startDate, endDate, status, fileUrl: fileUrl || null };

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

    router.push("/account/admin/contracts");
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
        <select value={typeOption} onChange={(e) => setTypeOption(e.target.value)} className={inputClass}>
          {contractTypes.map((t) => (
            <option key={t} value={t} className="bg-background">
              {t}
            </option>
          ))}
          <option value={CUSTOM_TYPE_VALUE} className="bg-background">
            سایر (وارد کردن دستی)
          </option>
        </select>
        {typeOption === CUSTOM_TYPE_VALUE && (
          <input
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            placeholder="نوع قرارداد دلخواه را بنویسید"
            className={`mt-2 ${inputClass}`}
          />
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground/80">بازه قرارداد</p>
          <ToggleSwitch checked={calendar === "jalali"} onChange={(v) => setCalendar(v ? "jalali" : "gregorian")} onLabel="شمسی" offLabel="میلادی" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <JalaliGregorianDateField label="تاریخ شروع" value={startDate} onChange={setStartDate} calendar={calendar} />
          <JalaliGregorianDateField label="تاریخ پایان" value={endDate} onChange={setEndDate} calendar={calendar} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">وضعیت</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          {Object.entries(CONTRACT_STATUS).map(([value, { label }]) => (
            <option key={value} value={value} className="bg-background">
              {label}
            </option>
          ))}
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
