"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { FooterContactContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function FooterContactForm({ initialContact }: { initialContact: FooterContactContent }) {
  const router = useRouter();
  const [contact, setContact] = useState(initialContact);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function set<K extends keyof FooterContactContent>(key: K, value: FooterContactContent[K]) {
    setContact((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/site-content/footer-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });

    setSaving(false);

    if (res.ok) {
      setMessage("ذخیره شد.");
      router.refresh();
    } else {
      setMessage("خطا در ذخیره‌سازی.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">آدرس</label>
          <input value={contact.address} onChange={(e) => set("address", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">شماره تماس (نمایشی)</label>
          <input dir="ltr" value={contact.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} placeholder="۰۲۱-۹۱۰۰۰۰۰۰" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">لینک تماس (tel:)</label>
          <input
            dir="ltr"
            value={contact.phoneHref}
            onChange={(e) => set("phoneHref", e.target.value)}
            className={inputClass}
            placeholder="tel:+982191000000"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">ایمیل</label>
          <input dir="ltr" value={contact.email} onChange={(e) => set("email", e.target.value)} className={inputClass} placeholder="info@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">اینستاگرام</label>
          <input
            dir="ltr"
            value={contact.instagramUrl}
            onChange={(e) => set("instagramUrl", e.target.value)}
            className={inputClass}
            placeholder="https://instagram.com/..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">لینکدین</label>
          <input
            dir="ltr"
            value={contact.linkedinUrl}
            onChange={(e) => set("linkedinUrl", e.target.value)}
            className={inputClass}
            placeholder="https://linkedin.com/..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">تلگرام</label>
          <input
            dir="ltr"
            value={contact.telegramUrl}
            onChange={(e) => set("telegramUrl", e.target.value)}
            className={inputClass}
            placeholder="https://t.me/..."
          />
        </div>
      </div>

      <p className="text-xs text-foreground/40">لینک‌های شبکه‌های اجتماعی که خالی بمانند، در فوتر نمایش داده نمی‌شوند.</p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="size-4" />
          {saving ? "در حال ذخیره..." : "ذخیره اطلاعات تماس"}
        </button>
        {message && <span className="text-sm text-foreground/60">{message}</span>}
      </div>
    </form>
  );
}
