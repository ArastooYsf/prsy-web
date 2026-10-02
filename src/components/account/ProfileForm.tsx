"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarUploader from "@/components/account/AvatarUploader";
import NationalIdInquiryField from "@/components/NationalIdInquiryField";
import EmailChangeSection from "@/components/account/EmailChangeSection";
import SavedContactPicker from "@/components/account/SavedContactPicker";
import { useToast } from "@/components/ToastProvider";
import FormErrorBanner from "@/components/ui/FormErrorBanner";

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type ProfileFormProps = {
  role: string;
  customerType: string | null;
  initialName: string;
  initialEmail: string;
  initialEmailVerified: boolean;
  initialPendingEmail: string | null;
  initialAvatarUrl: string;
  initialCompanyName: string;
  initialNationalId: string;
};

export default function ProfileForm({
  role,
  customerType,
  initialName,
  initialEmail,
  initialEmailVerified,
  initialPendingEmail,
  initialAvatarUrl,
  initialCompanyName,
  initialNationalId,
}: ProfileFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [nationalId, setNationalId] = useState(initialNationalId);
  const [saving, setSaving] = useState(false);
  // Field-level problems (invalid email/phone, checked before the request
  // even goes out) stay on the toast below — this is only for the request
  // itself failing, which the toast alone (gone in a few seconds) doesn't
  // leave any trace of once the user looks back at the form.
  const [saveError, setSaveError] = useState<string | null>(null);

  const isCustomer = role === "CUSTOMER";
  const isLegalCustomer = isCustomer && customerType === "LEGAL";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setSaveError(null);

    let res: Response;
    try {
      res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl, companyName, nationalId }),
      });
    } catch {
      setSaving(false);
      setSaveError("اتصال برقرار نشد. اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.");
      return;
    }

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSaveError(body?.error || "خطا در بروزرسانی اطلاعات. لطفاً دوباره تلاش کنید.");
      return;
    }

    showToast("اطلاعات با موفقیت ذخیره شد.");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
      <h3 className="text-base font-bold">اطلاعات شخصی</h3>

      <AvatarUploader value={avatarUrl} onChange={setAvatarUrl} nameForAlt={name || initialEmail} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام و نام خانوادگی</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div>
          <EmailChangeSection
            currentEmail={initialEmail}
            emailVerified={initialEmailVerified}
            pendingEmail={initialPendingEmail}
          />
        </div>
      </div>

      {/* Phone stays available to every role (staff included) — only the
          address book is customer-only, same scoping the old single-value
          fields had (phone always shown, alternatePhone/address customer-only). */}
      <div className="space-y-5 border-t border-foreground/10 pt-5">
        <SavedContactPicker kind="phone" />
        {isCustomer && <SavedContactPicker kind="address" />}
      </div>

      {isLegalCustomer && (
        <div className="grid grid-cols-1 gap-5 border-t border-foreground/10 pt-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">نام شرکت</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
          </div>
          <NationalIdInquiryField value={nationalId} onChange={setNationalId} />
        </div>
      )}

      {saveError && <FormErrorBanner message={saveError} onDismiss={() => setSaveError(null)} />}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
      </button>
    </form>
  );
}
