import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type Crumb = { label: string; href?: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسیر ناوبری" className="flex flex-wrap items-center gap-1.5 text-xs text-foreground/50">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.href && !last ? (
              <Link href={item.href} className="transition-colors hover:text-accent-500">
                {item.label}
              </Link>
            ) : (
              <span aria-current={last ? "page" : undefined} className={last ? "text-foreground/80" : undefined}>
                {item.label}
              </span>
            )}
            {!last && <ChevronLeft aria-hidden className="size-3.5 text-foreground/25" />}
          </span>
        );
      })}
    </nav>
  );
}
