"use client";

import { useState, type ReactNode } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Search, X } from "lucide-react";

export type SiteContentSection = {
  id: string;
  icon: ReactNode;
  title: string;
  /** One-line description shown under the title in the collapsed header. */
  description: string;
  /** Plain-text join of every current field value in this section — what the search bar actually matches against, not just the static title/description. */
  searchText: string;
  content: ReactNode;
};

function matchesQuery(section: SiteContentSection, query: string): boolean {
  const haystack = `${section.title} ${section.description} ${section.searchText}`.toLowerCase();
  return haystack.includes(query);
}

// Fully controlled (not Radix's uncontrolled defaultValue) so a search can
// force specific sections open while the user can still freely open/close
// any section by hand the rest of the time — both write into the same
// `openIds` state, so they can never fight each other.
export default function SiteContentAccordion({ sections }: { sections: SiteContentSection[] }) {
  const [query, setQuery] = useState("");
  const [openIds, setOpenIds] = useState<string[]>([]);

  const handleQueryChange = (next: string) => {
    setQuery(next);
    const trimmed = next.trim().toLowerCase();
    if (!trimmed) {
      setOpenIds([]);
      return;
    }
    setOpenIds(sections.filter((s) => matchesQuery(s, trimmed)).map((s) => s.id));
  };

  const trimmedQuery = query.trim().toLowerCase();
  const visibleSections = trimmedQuery ? sections.filter((s) => matchesQuery(s, trimmedQuery)) : sections;

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-1 mb-6 bg-background/95 px-1 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="جست‌وجو در محتوای این بخش..."
            className="min-h-11 w-full rounded-full border border-foreground/10 bg-foreground/5 py-2 pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-accent-500/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleQueryChange("")}
              aria-label="پاک کردن جست‌وجو"
              className="absolute left-3 top-1/2 flex min-h-8 min-w-8 -translate-y-1/2 items-center justify-center text-foreground/40 transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {visibleSections.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-foreground/15 p-8 text-center text-sm text-foreground/50">
          نتیجه‌ای برای «{query}» پیدا نشد.
        </p>
      ) : (
        <Accordion.Root type="multiple" value={openIds} onValueChange={setOpenIds} className="space-y-3">
          {visibleSections.map((section) => (
            <Accordion.Item
              key={section.id}
              value={section.id}
              className="overflow-hidden rounded-2xl border border-foreground/10"
            >
              <Accordion.Header>
                <Accordion.Trigger className="group flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-right">
                  <span className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400">
                      {section.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{section.title}</span>
                      <span className="block text-xs text-foreground/50">{section.description}</span>
                    </span>
                  </span>
                  <ChevronDown
                    aria-hidden
                    className="size-4 shrink-0 text-foreground/50 transition-transform group-data-[state=open]:rotate-180"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden border-t border-foreground/10 px-5 py-6 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                {section.content}
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}
    </div>
  );
}
