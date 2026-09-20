"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "@phosphor-icons/react";
import { useToast } from "@/components/ToastProvider";
import { isValidEmail, isValidIranPhone } from "@/lib/validation";

type FormState = {
  name: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
  website: string;
};

const TOPICS = [
  "مشاوره اولیه",
  "طراحی و مهندسی",
  "اجرای پروژه (EPC)",
  "خرید محصول",
  "سایر",
];

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  topic: TOPICS[0],
  message: "",
  website: "",
};

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-all duration-200 focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/20";

export default function ConsultationForm() {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      showToast("لطفاً نام و شماره تماس خود را وارد کنید.", "error");
      return;
    }
    if (!isValidIranPhone(form.phone)) {
      showToast("شماره تماس معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹", "error");
      return;
    }
    if (form.email.trim() && !isValidEmail(form.email)) {
      showToast("ایمیل معتبر نیست.", "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error ?? "ثبت درخواست ناموفق بود، دوباره تلاش کنید.", "error");
      }
    } catch {
      showToast("ارتباط با سرور برقرار نشد، دوباره تلاش کنید.", "error");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-accent-500/30 bg-accent-500/10 p-10 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/20 text-accent-400 shadow-md shadow-accent-500/10">
          <Check size={28} weight="bold" />
        </div>
        <h3 className="mt-5 text-xl font-bold">درخواست شما ثبت شد</h3>
        <p className="mt-2 leading-7 text-foreground/70">
          کارشناسان ما ظرف ۴۸ ساعت کاری با شما تماس می‌گیرند.
        </p>
        <button
          type="button"
          onClick={() => {
            setForm(initialState);
            setSubmitted(false);
          }}
          className="mt-6 rounded-full border border-foreground/15 px-6 py-2.5 text-sm font-semibold transition-colors duration-300 hover:bg-foreground/5"
        >
          ارسال درخواست جدید
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto max-w-xl overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-foreground/70">
            نام و نام خانوادگی *
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="مثلاً علی رضایی"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-2 block text-sm text-foreground/70">
            شماره تماس *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={handleChange}
            className={inputClass}
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            dir="ltr"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-foreground/70">
            ایمیل
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="you@example.com"
            dir="ltr"
          />
        </div>
        <div>
          <label htmlFor="topic" className="mb-2 block text-sm text-foreground/70">
            موضوع درخواست
          </label>
          <select
            id="topic"
            name="topic"
            value={form.topic}
            onChange={handleChange}
            className={inputClass}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t} className="bg-background">
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-2 block text-sm text-foreground/70">
            توضیحات
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            className={inputClass}
            placeholder="کمی درباره پروژه یا نیاز خود بنویسید..."
          />
        </div>
      </div>

      <input
        type="text"
        name="website"
        value={form.website}
        onChange={handleChange}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <button
        type="submit"
        disabled={sending}
        className="mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-accent-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:text-base"
      >
        {sending ? "در حال ارسال..." : "ارسال درخواست"}
      </button>
    </form>
  );
}
