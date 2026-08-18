"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function NewTicketForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      showToast("موضوع و متن پیام الزامی هستند.", "error");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/account/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ثبت تیکت.", "error");
      return;
    }

    const { ticket } = await res.json();
    router.push(`/account/tickets/${ticket.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">موضوع</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
          placeholder="موضوع تیکت"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن پیام</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className={inputClass}
          placeholder="توضیحات درخواست خود را بنویسید..."
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ثبت..." : "ثبت تیکت"}
      </button>
    </form>
  );
}
