import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ChevronLeft } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getProvider, getService } from "@/lib/integrations/registry";
import IntegrationServiceForm from "@/components/admin/IntegrationServiceForm";

export async function generateMetadata({
  params,
}: {
  params: { providerId: string; serviceId: string };
}): Promise<Metadata> {
  const service = getService(params.providerId, params.serviceId);
  return { title: service ? service.displayName : "سرویس یکپارچه‌سازی", robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function IntegrationServicePage({
  params,
}: {
  params: { providerId: string; serviceId: string };
}) {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const provider = getProvider(params.providerId);
  const service = getService(params.providerId, params.serviceId);
  if (!provider || !service) notFound();

  return (
    <div>
      <Link
        href={`/account/admin/integrations/${provider.id}`}
        className="mb-4 inline-flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground"
      >
        <ChevronLeft className="size-3.5 rotate-180" />
        بازگشت به {provider.displayName}
      </Link>

      <h2 className="mb-1 text-lg font-bold">{service.displayName}</h2>
      <p className="mb-6 text-sm text-foreground/60">{service.description}</p>

      <IntegrationServiceForm
        providerId={provider.id}
        serviceId={service.id}
        fields={service.fields}
        resultLabels={service.resultLabels}
      />
    </div>
  );
}
