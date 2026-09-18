import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ChevronLeft, Plug } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { INTEGRATIONS_REGISTRY, isProviderConnected } from "@/lib/integrations/registry";
import { CONNECTION_STATUS } from "@/lib/status-labels";
import StatusBadge from "@/components/ui/StatusBadge";

export const metadata: Metadata = {
  title: "یکپارچه‌سازی‌ها",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function IntegrationsHubPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
        <Plug className="size-5 text-accent-400" />
        یکپارچه‌سازی‌ها
      </h2>
      <p className="mb-6 text-sm text-foreground/60">
        مرکز مدیریت تمام سرویس‌های بیرونی پروژه. وضعیت اتصال هر سرویس بر اساس تنظیم‌بودن متغیرهای محیطی موردنیازش،
        در سرور محاسبه می‌شود.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS_REGISTRY.map((provider) => {
          const connected = isProviderConnected(provider);
          const Icon = provider.icon;
          return (
            <Link
              key={provider.id}
              href={`/account/admin/integrations/${provider.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 transition-colors hover:border-accent-500/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-accent-400">
                    <Icon className="size-4.5" />
                  </span>
                  <span className="font-semibold">{provider.displayName}</span>
                </div>
                <StatusBadge
                  status={CONNECTION_STATUS[connected ? "CONNECTED" : "NOT_CONFIGURED"]}
                  className="shrink-0"
                />
              </div>
              <p className="text-xs leading-6 text-foreground/55">{provider.description}</p>
              <div className="mt-auto flex items-center justify-between pt-1 text-xs text-foreground/40">
                <span>{provider.services.length > 0 ? `${provider.services.length} سرویس` : "بدون سرویس اجرایی"}</span>
                <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
