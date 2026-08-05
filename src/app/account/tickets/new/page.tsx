import type { Metadata } from "next";
import NewTicketForm from "@/components/account/NewTicketForm";

export const metadata: Metadata = {
  title: "ثبت تیکت جدید",
  robots: { index: false, follow: false },
};

export default function NewTicketPage() {
  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">ثبت تیکت جدید</h2>
      <div className="mx-auto max-w-xl">
        <NewTicketForm />
      </div>
    </div>
  );
}
