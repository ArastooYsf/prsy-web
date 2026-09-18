"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useAsyncPost } from "@/hooks/useAsyncPost";

export default function RetryNationalIdInquiry({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { loading, run } = useAsyncPost();

  const retry = async () => {
    const { ok, body } = await run(`/api/admin/customers/${customerId}/verify-national-id`);

    if (!ok) {
      showToast((body as { error?: string } | null)?.error || "استعلام مجدد ناموفق بود.", "error");
      return;
    }

    showToast("استعلام با موفقیت تأیید شد.");
    router.refresh();
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={retry}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-accent-500/40 px-4 text-xs font-semibold text-accent-400 transition-colors hover:bg-accent-500/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
      تلاش مجدد استعلام
    </button>
  );
}
