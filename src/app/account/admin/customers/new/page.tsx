import type { Metadata } from "next";
import CustomerForm from "@/components/admin/CustomerForm";

export const metadata: Metadata = {
  title: "افزودن مشتری",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function NewCustomerPage() {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold">افزودن مشتری</h2>
      <p className="mb-6 text-sm text-foreground/60">
        حساب کاربری جدید مشتری را مستقیماً بسازید — بدون نیاز به ثبت‌نام خود مشتری. حساب بلافاصله فعال خواهد بود.
      </p>
      <div className="mx-auto max-w-xl">
        <CustomerForm
          submitLabel="ثبت مشتری"
          notesLabel="یادداشت داخلی (اختیاری)"
          notesPlaceholder="هر توضیح داخلی درباره این مشتری..."
        />
      </div>
    </div>
  );
}
