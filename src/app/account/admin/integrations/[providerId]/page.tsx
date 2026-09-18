import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ChevronLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getProvider, isProviderConnected } from "@/lib/integrations/registry";
import { CONNECTION_STATUS } from "@/lib/status-labels";
import StatusBadge from "@/components/ui/StatusBadge";
import TestConnectionButton from "@/components/admin/TestConnectionButton";

export async function generateMetadata({ params }: { params: { providerId: string } }): Promise<Metadata> {
  const provider = getProvider(params.providerId);
  return { title: provider ? provider.displayName : "یکپارچه‌سازی", robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function IntegrationProviderPage({ params }: { params: { providerId: string } }) {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const provider = getProvider(params.providerId);
  if (!provider) notFound();

  const connected = isProviderConnected(provider);
  const Icon = provider.icon;

  return (
    <div>
      <Link href="/account/admin/integrations" className="mb-4 inline-flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground">
        <ChevronLeft className="size-3.5 rotate-180" />
        بازگشت به یکپارچه‌سازی‌ها
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-accent-400">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold">{provider.displayName}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-6 text-foreground/55">{provider.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-foreground/40">
              {provider.baseUrl && <span dir="ltr">{provider.baseUrl}</span>}
              <StatusBadge status={CONNECTION_STATUS[connected ? "CONNECTED" : "NOT_CONFIGURED"]} />
              {!connected && <span>{provider.envVarsRequired.join("، ")} را تنظیم کنید</span>}
            </div>
          </div>
        </div>
        {provider.testConnection && <TestConnectionButton providerId={provider.id} />}
      </div>

      {provider.services.length === 0 ? (
        <p className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 text-center text-sm text-foreground/60">
          این سرویس زیرساخت پسیو است و عملکرد قابل‌اجرای مجزایی برای ادمین ندارد.
        </p>
      ) : (
        <div className="space-y-3">
          {provider.services.map((service) => (
            <Link
              key={service.id}
              href={`/account/admin/integrations/${provider.id}/${service.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 transition-colors hover:border-accent-500/30"
            >
              <div className="min-w-0">
                <p className="font-semibold">{service.displayName}</p>
                <p className="mt-1 text-xs text-foreground/55">{service.description}</p>
              </div>
              <ChevronLeft className="size-4 shrink-0 text-foreground/40" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
