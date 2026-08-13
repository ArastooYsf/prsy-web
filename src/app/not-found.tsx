"use client";

import ErrorPageShell from "@/components/errors/ErrorPageShell";
import GeneratorIcon from "@/components/errors/GeneratorIcon";

export default function NotFound() {
  return (
    <ErrorPageShell
      code="404"
      icon={<GeneratorIcon />}
      title="این مسیر رو پیدا نکردیم!"
      description="انگار مسیر عوض شده یا اصلاً وجود نداشته. نگران نباشید، برگردید به صفحه اصلی یا محصولات رو ببینید."
      primaryHref="/"
      primaryLabel="بازگشت به صفحه اصلی"
      secondaryHref="/products"
      secondaryLabel="مشاهده محصولات"
    />
  );
}
