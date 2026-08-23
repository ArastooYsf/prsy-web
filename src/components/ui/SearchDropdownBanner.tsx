import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";

type SearchDropdownBannerProps = {
  title: string;
  description?: string;
  href: string;
  ctaLabel?: string;
  /** Optional cover image; falls back to an icon tile when omitted. */
  imageSrc?: string;
};

// Placeholder promo slot shown in the search dropdown — deliberately just
// props in, markup out, so this can later be swapped for admin-controlled
// content (or a different fixed promo) without touching HeaderSearch itself.
export default function SearchDropdownBanner({
  title,
  description,
  href,
  ctaLabel = "مشاهده",
  imageSrc,
}: SearchDropdownBannerProps) {
  return (
    <Link
      href={href}
      className="group m-3 flex items-center gap-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-l from-accent-500/15 via-accent-500/5 to-transparent p-4 transition-colors hover:border-accent-500/30"
    >
      <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 shadow-md shadow-accent-500/20">
        {imageSrc ? (
          <Image src={imageSrc} alt="" fill sizes="56px" className="object-cover" />
        ) : (
          <Sparkles className="size-6 text-white" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {description && <p className="mt-0.5 line-clamp-1 text-xs text-foreground/60">{description}</p>}
      </div>

      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent-400 transition-transform group-hover:-translate-x-0.5">
        {ctaLabel}
        <ArrowLeft className="size-3.5" />
      </span>
    </Link>
  );
}
