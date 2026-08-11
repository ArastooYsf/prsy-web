import type { Metadata } from "next";
import CustomerForm from "@/components/admin/CustomerForm";
import CsvImportForm from "@/components/admin/CsvImportForm";

export const metadata: Metadata = {
  title: "Migrate مشتریان قدیمی",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function MigrateCustomersPage() {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold">Migrate مشتریان قدیمی</h2>
      <p className="mb-6 text-sm text-foreground/60">
        اطلاعات مشتریانی که قبل از راه‌اندازی این سیستم ثبت شده بودند را اینجا وارد کنید — یک‌به‌یک یا با ایمپورت CSV.
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-base font-bold">ثبت دستی یک مشتری</h3>
          <CustomerForm
            submitLabel="ثبت مشتری قدیمی"
            notesLabel="سوابق قبلی مشتری"
            notesPlaceholder="مثلاً: مشتری از سال ۱۴۰۱، ۳ قرارداد نگهداری قبلی، سابقه پرداخت خوب..."
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="mb-4 text-base font-bold">ایمپورت گروهی از CSV</h3>
          <CsvImportForm />
        </section>
      </div>
    </div>
  );
}
