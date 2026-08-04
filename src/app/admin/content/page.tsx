import { getSiteContentMap } from "@/lib/site-content";
import SiteContentForm from "@/components/admin/SiteContentForm";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const values = await getSiteContentMap();

  return (
    <div>
      <h2 className="mb-2 text-lg font-bold">محتوای سایت</h2>
      <p className="mb-6 text-sm text-foreground/60">
        فقط بخش‌های زیر از پنل قابل‌ویرایش هستند؛ فیلدهای خالی همان مقدار پیش‌فرض کد را نشان می‌دهند.
      </p>
      <SiteContentForm initialValues={values} />
    </div>
  );
}
