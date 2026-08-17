"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import { Loader2, Search, X } from "lucide-react";

type SearchGroup<T> = { items: T[]; hasMore: boolean };

type SearchResults = {
  customers: SearchGroup<{ id: string; name: string | null; email: string }>;
  tickets: SearchGroup<{ id: string; subject: string }>;
  contracts: SearchGroup<{ id: string; title: string }>;
  orders: SearchGroup<{ id: string; orderNumber: string }>;
};

const EMPTY_RESULTS: SearchResults = {
  customers: { items: [], hasMore: false },
  tickets: { items: [], hasMore: false },
  contracts: { items: [], hasMore: false },
  orders: { items: [], hasMore: false },
};

function hasAnyResults(results: SearchResults) {
  return (
    results.customers.items.length > 0 ||
    results.tickets.items.length > 0 ||
    results.contracts.items.length > 0 ||
    results.orders.items.length > 0
  );
}

export default function AdminSearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const showDropdown = open && query.trim().length >= 2;

  return (
    <Popover.Root open={showDropdown} onOpenChange={(v) => setOpen(v)}>
      <Popover.Anchor asChild>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="جست‌وجو در مشتریان، تیکت‌ها، قراردادها، سفارش‌ها..."
            className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-accent-500/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults(EMPTY_RESULTS);
              }}
              aria-label="پاک کردن جست‌وجو"
              className="absolute left-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-foreground/40 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className="z-50 max-h-[70vh] w-[var(--radix-popover-trigger-width)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-background shadow-2xl"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-6 text-sm text-foreground/50">
              <Loader2 className="size-4 animate-spin" />
              در حال جست‌وجو...
            </div>
          ) : hasAnyResults(results) ? (
            <div className="divide-y divide-white/5">
              <ResultGroup
                title="مشتریان"
                group={results.customers}
                onClose={() => setOpen(false)}
                viewAllHref={`/account/admin/customers?q=${encodeURIComponent(query.trim())}`}
                renderItem={(c) => (
                  <Link
                    key={c.id}
                    href={`/account/admin/customers?q=${encodeURIComponent(c.email)}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-white/5"
                  >
                    <p className="font-medium">{c.name || "—"}</p>
                    <p dir="ltr" className="text-right text-xs text-foreground/50">
                      {c.email}
                    </p>
                  </Link>
                )}
              />
              <ResultGroup
                title="تیکت‌ها"
                group={results.tickets}
                onClose={() => setOpen(false)}
                viewAllHref={`/account/admin/tickets?q=${encodeURIComponent(query.trim())}`}
                renderItem={(t) => (
                  <Link
                    key={t.id}
                    href={`/account/admin/tickets/${t.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-white/5"
                  >
                    {t.subject}
                  </Link>
                )}
              />
              <ResultGroup
                title="قراردادها"
                group={results.contracts}
                onClose={() => setOpen(false)}
                viewAllHref={`/account/admin/contracts?q=${encodeURIComponent(query.trim())}`}
                renderItem={(c) => (
                  <Link
                    key={c.id}
                    href={`/account/admin/contracts/${c.id}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-white/5"
                  >
                    {c.title}
                  </Link>
                )}
              />
              <ResultGroup
                title="سفارش‌ها"
                group={results.orders}
                onClose={() => setOpen(false)}
                viewAllHref={`/account/admin/orders?q=${encodeURIComponent(query.trim())}`}
                renderItem={(o) => (
                  <Link
                    key={o.id}
                    href={`/account/admin/orders/${o.id}`}
                    onClick={() => setOpen(false)}
                    dir="ltr"
                    className="block px-4 py-2.5 text-right text-sm hover:bg-white/5"
                  >
                    {o.orderNumber}
                  </Link>
                )}
              />
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-foreground/50">نتیجه‌ای یافت نشد.</p>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ResultGroup<T>({
  title,
  group,
  renderItem,
  viewAllHref,
  onClose,
}: {
  title: string;
  group: SearchGroup<T>;
  renderItem: (item: T) => React.ReactNode;
  viewAllHref: string;
  onClose: () => void;
}) {
  if (group.items.length === 0) return null;

  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-foreground/40">{title}</p>
      {group.items.map(renderItem)}
      {group.hasMore && (
        <Link
          href={viewAllHref}
          onClick={onClose}
          className="block px-4 py-2 text-xs font-medium text-accent-400 hover:text-accent-300"
        >
          مشاهده‌ی همه
        </Link>
      )}
    </div>
  );
}
