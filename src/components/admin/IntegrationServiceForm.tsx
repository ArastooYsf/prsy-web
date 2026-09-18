"use client";

import { useState, type FormEvent } from "react";
import { Loader2, PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import type { IntegrationFieldSchema } from "@/lib/integrations/registry";

type RunOutcome = { ok: true; data: unknown; message: string | null } | { ok: false; error: string };

// Renders a service's response readably instead of as raw JSON. `labels`
// (IntegrationService.resultLabels) maps a field's real response key to its
// Persian label — an empty-string label means "hide this field" (e.g.
// WatterBillInfo's raw HTML `print` blob), and a missing key falls back to
// the raw key name so a provider that hasn't been given labels yet (not yet
// following this reference pattern) still renders something instead of
// nothing.
function ResultValue({ value, labels }: { value: unknown; labels?: Record<string, string> }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-foreground/40">—</span>;
  }
  if (typeof value === "boolean") {
    return <span className={value ? "text-emerald-400" : "text-red-400"}>{value ? "بله" : "خیر"}</span>;
  }
  if (Array.isArray(value)) {
    return <span>{value.length ? value.join("، ") : "—"}</span>;
  }
  if (typeof value === "object") {
    return (
      <dl className="mt-1 space-y-1 border-r-2 border-foreground/10 pr-3">
        {Object.entries(value as Record<string, unknown>)
          .filter(([k]) => labels?.[k] !== "")
          .map(([k, v]) => (
            <div key={k} className="flex flex-wrap items-baseline gap-2 text-xs">
              <dt className="text-foreground/45">{labels?.[k] || k}</dt>
              <dd className="font-medium">
                <ResultValue value={v} labels={labels} />
              </dd>
            </div>
          ))}
      </dl>
    );
  }
  return <span dir="auto">{String(value)}</span>;
}

export default function IntegrationServiceForm({
  providerId,
  serviceId,
  fields,
  resultLabels,
}: {
  providerId: string;
  serviceId: string;
  fields: IntegrationFieldSchema[];
  resultLabels?: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, ""])),
  );
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOutcome(null);
    const res = await fetch("/api/admin/integrations/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, serviceId, input: values }),
    });
    const body = await res.json().catch(() => null);
    setLoading(false);
    setOutcome(
      res.ok
        ? { ok: true, data: body?.data ?? null, message: body?.message ?? null }
        : { ok: false, error: body?.error || "اجرا ناموفق بود." },
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        {fields.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-1.5 block text-sm font-medium text-foreground/80">
              {field.label}
              {field.required && <span className="text-red-400"> *</span>}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={field.name}
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-foreground/15 bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent-500/50"
              />
            ) : (
              <input
                id={field.name}
                type="text"
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
                className="min-h-11 w-full rounded-xl border border-foreground/15 bg-background px-3.5 text-sm outline-none transition-colors focus:border-accent-500/50"
                dir="auto"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-500/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
          {loading ? "در حال اجرا..." : "اجرا"}
        </button>
      </form>

      {outcome && (
        <div
          className={`rounded-2xl border p-5 ${
            outcome.ok ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-red-500/30 bg-red-500/[0.06]"
          }`}
        >
          <p className={`mb-3 flex items-center gap-2 text-sm font-semibold ${outcome.ok ? "text-emerald-400" : "text-red-400"}`}>
            {outcome.ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
            {outcome.ok ? outcome.message || "اجرا با موفقیت انجام شد." : outcome.error}
          </p>
          {outcome.ok && outcome.data !== null && (
            <div className="text-sm">
              {typeof outcome.data === "object" && !Array.isArray(outcome.data) ? (
                <ResultValue value={outcome.data} labels={resultLabels} />
              ) : (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-foreground/45">{resultLabels?.$root || "نتیجه"}</span>
                  <ResultValue value={outcome.data} labels={resultLabels} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
