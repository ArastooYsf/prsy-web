import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import NewTicketForm from "@/components/account/NewTicketForm";

export const metadata: Metadata = {
  title: "ثبت تیکت جدید",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function firstParam(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" ? v.slice(0, 500) : "";
}

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: { subject?: string | string[]; message?: string | string[] };
}) {
  const session = await getServerSession(authOptions);

  if (session!.user.role !== "CUSTOMER") {
    redirect("/account/admin");
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">ثبت تیکت جدید</h2>
      <div className="mx-auto max-w-xl">
        <NewTicketForm
          initialSubject={firstParam(searchParams.subject)}
          initialMessage={firstParam(searchParams.message)}
        />
      </div>
    </div>
  );
}
