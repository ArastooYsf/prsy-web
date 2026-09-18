"use client";

import { useState } from "react";
import { Zap, CheckCircle2, XCircle } from "lucide-react";
import { useAsyncPost } from "@/hooks/useAsyncPost";

export default function TestConnectionButton({ providerId }: { providerId: string }) {
  const { loading, run: post } = useAsyncPost();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const run = async () => {
    setResult(null);
    const { ok, body } = await post("/api/admin/integrations/test-connection", { providerId });
    const parsed = body as { message?: string; error?: string } | null;
    const message = ok ? parsed?.message || "اتصال موفق بود." : parsed?.error || "اتصال ناموفق بود.";
    setResult({ ok, message });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={run}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/40 px-4 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Zap className={`size-3.5 ${loading ? "animate-pulse" : ""}`} />
        {loading ? "در حال تست..." : "تست اتصال"}
      </button>
      {result && (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${result.ok ? "text-emerald-400" : "text-red-400"}`}
        >
          {result.ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
          {result.message}
        </span>
      )}
    </div>
  );
}
