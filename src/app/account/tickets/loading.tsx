import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { TicketListItem } from "./TicketListItem";

const PLACEHOLDER_ROWS = Array.from({ length: 6 });

export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessageSquare className="size-5 text-accent-400" />
          تیکت‌های پشتیبانی
        </h2>
        <Link
          href="/account/tickets/new"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          ثبت تیکت جدید
        </Link>
      </div>

      <div className="space-y-3">
        {PLACEHOLDER_ROWS.map((_, i) => (
          <TicketListItem key={i} ticket={null} />
        ))}
      </div>
    </div>
  );
}
