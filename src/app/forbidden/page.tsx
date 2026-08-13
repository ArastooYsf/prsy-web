import type { Metadata } from "next";
import ErrorPageShell from "@/components/errors/ErrorPageShell";
import LockIcon from "@/components/errors/LockIcon";

export const metadata: Metadata = {
  title: "دسترسی ممنوع",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <ErrorPageShell
      code="403"
      icon={<LockIcon />}
      title="این بخش برای شما قفل شده"
      description="اگه فکر می‌کنید این یه اشتباهه، با پشتیبانی تماس بگیرید."
      primaryHref="/"
      primaryLabel="بازگشت به صفحه اصلی"
      secondaryHref="/contact"
      secondaryLabel="تماس با پشتیبانی"
    />
  );
}
