"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, X } from "lucide-react";
import type { FooterContactContent } from "@/lib/site-content";
import { getSocialLink } from "@/lib/social-platforms";

const MAX_SOCIAL_LINKS = 12;
// Rows need a stable key independent of their (editable) text.
let nextRowId = 1;

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function FooterContactForm({ initialContact }: { initialContact: FooterContactContent }) {
  const router = useRouter();
  const [contact, setContact] = useState(initialContact);
  const [links, setLinks] = useState(() => initialContact.socialLinks.map((url) => ({ id: nextRowId++, url })));
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
      body: JSON.stringify({ ...contact, socialLinks: links.map((l) => l.url).filter((u) => u.trim()) }),
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
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
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">نقشه (مختصات یا لینک — اختیاری)</label>
          <input
            dir="ltr"
            value={contact.mapUrl}
            onChange={(e) => set("mapUrl", e.target.value)}
            className={inputClass}
            placeholder="35.7219, 51.3347  یا  https://maps.google.com/..."
          />
          <p className="mt-1 text-xs text-foreground/40">خالی بماند تا نقشه بر اساس متن آدرس جست‌وجو شود.</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground/80">شبکه‌های اجتماعی</p>
        <ul className="space-y-2">
          {links.map((row) => {
            const { name, Icon, known } = getSocialLink(row.url);
            return (
              <li key={row.id} className="flex items-center gap-2">
                <span
                  title={row.url.trim() ? (known ? name : `${name} — آیکون عمومی (دامنه ناشناخته)`) : "آیکون با وارد کردن لینک خودکار تشخیص داده می‌شود"}
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-foreground/10 bg-foreground/5 text-accent-400"
                >
                  <Icon size={20} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <input
                    dir="ltr"
                    value={row.url}
                    onChange={(e) => setLinks((prev) => prev.map((r) => (r.id === row.id ? { ...r, url: e.target.value } : r)))}
                    aria-label="لینک شبکه اجتماعی"
                    className={inputClass}
                    placeholder="https://instagram.com/..."
                  />
                  {row.url.trim() && (
                    <p className="mt-1 text-xs text-foreground/50" data-testid="social-detected">
                      {known ? name : `${name} — آیکون عمومی`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setLinks((prev) => prev.filter((r) => r.id !== row.id))}
                  aria-label="حذف لینک"
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-red-500/30 text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
        {links.length < MAX_SOCIAL_LINKS && (
          <button
            type="button"
            onClick={() => setLinks((prev) => [...prev, { id: nextRowId++, url: "" }])}
            className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-full border border-foreground/10 px-4 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Plus className="size-3.5" />
            افزودن لینک شبکه اجتماعی
          </button>
        )}
        <p className="mt-2 text-xs text-foreground/40">
          فقط لینک را وارد کنید؛ شبکه و آیکون از روی دامنه تشخیص داده می‌شود. دامنه‌ی ناشناخته آیکون عمومی می‌گیرد و ردیف خالی ذخیره نمی‌شود.
        </p>
      </div>

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
