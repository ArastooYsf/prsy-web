"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

export default function PasswordForm() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      showToast("رمز عبور جدید باید حداقل ۸ کاراکتر باشد.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("رمز عبور جدید و تکرار آن یکسان نیستند.", "error");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در تغییر رمز عبور.", "error");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("رمز عبور با موفقیت تغییر کرد.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
      <h3 className="text-base font-bold">تغییر رمز عبور</h3>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">رمز عبور فعلی</label>
        <input
          dir="ltr"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">رمز عبور جدید</label>
        <input
          dir="ltr"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
          placeholder="حداقل ۸ کاراکتر"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">تکرار رمز عبور جدید</label>
        <input
          dir="ltr"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full border border-foreground/15 px-7 py-3 text-sm font-semibold transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "تغییر رمز عبور"}
      </button>
    </form>
  );
}
