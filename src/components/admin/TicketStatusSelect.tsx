"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "OPEN", label: "باز" },
  { value: "IN_PROGRESS", label: "در حال بررسی" },
  { value: "ANSWERED", label: "پاسخ داده‌شده" },
  { value: "CLOSED", label: "بسته‌شده" },
];

export default function TicketStatusSelect({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  const handleChange = async (newStatus: string) => {
    setValue(newStatus);
    setSaving(true);
    await fetch(`/api/admin/tickets/${ticketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    router.refresh();
  };

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-accent-500/50 disabled:opacity-60"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-background">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
