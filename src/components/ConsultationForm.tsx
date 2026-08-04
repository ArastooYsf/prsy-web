"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type FormState = {
  name: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
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
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-all duration-200 focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/20";

export default function ConsultationForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("لطفاً نام و شماره تماس خود را وارد کنید.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-accent-500/30 bg-accent-500/10 p-10 text-center shadow-xl shadow-accent-500/10"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/20 text-accent-400 shadow-md shadow-accent-500/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
          className="mt-6 rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold transition-colors duration-300 hover:bg-white/5"
        >
          ارسال درخواست جدید
        </button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-black/10 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm text-foreground/70">
            نام و نام خانوادگی *
          </label>
          <input
            id="name"
            name="name"
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

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        className="mt-6 w-full rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/30 sm:w-auto sm:text-base"
      >
        ارسال درخواست
      </button>
    </form>
  );
}
