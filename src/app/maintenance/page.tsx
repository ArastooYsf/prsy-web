import type { Metadata } from "next";
import ErrorPageShell from "@/components/errors/ErrorPageShell";
import WrenchIcon from "@/components/errors/WrenchIcon";

export const metadata: Metadata = {
  title: "در حال به‌روزرسانی",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <ErrorPageShell
      eyebrow="در حال به‌روزرسانی"
      icon={<WrenchIcon />}
      title="داریم سایت رو بهتر می‌کنیم"
      description="سایت برای مدتی کوتاه در دسترس نیست. تا چند دقیقه دیگه برمی‌گردیم — لطفاً بعداً دوباره سر بزنید."
      primaryHref="/contact"
      primaryLabel="تماس با پشتیبانی"
    />
  );
}
