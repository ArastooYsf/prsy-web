"use client";

import type { ReactNode } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

export type ProductTabSection = {
  id: string;
  label: string;
  content: ReactNode;
};

export default function ProductTabs({ sections }: { sections: ProductTabSection[] }) {
  if (sections.length === 0) return null;

  return (
    <div>
      {/* Desktop: horizontal tabs */}
      <Tabs.Root defaultValue={sections[0].id} className="hidden lg:block">
        <Tabs.List className="flex gap-6 border-b border-foreground/10" aria-label="جزئیات محصول">
          {sections.map((section) => (
            <Tabs.Trigger
              key={section.id}
              value={section.id}
              className="relative min-h-11 px-1 text-sm font-semibold text-foreground/50 transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent-500 after:opacity-0 after:transition-opacity hover:text-foreground/80 data-[state=active]:text-foreground data-[state=active]:after:opacity-100"
            >
              {section.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {sections.map((section) => (
          <Tabs.Content key={section.id} value={section.id} className="pt-6">
            {section.content}
          </Tabs.Content>
        ))}
      </Tabs.Root>

      {/* Mobile: accordion */}
      <Accordion.Root type="single" collapsible defaultValue={sections[0].id} className="space-y-3 lg:hidden">
        {sections.map((section) => (
          <Accordion.Item
            key={section.id}
            value={section.id}
            className="overflow-hidden rounded-2xl border border-foreground/10"
          >
            <Accordion.Header>
              <Accordion.Trigger className="group flex min-h-11 w-full items-center justify-between px-4 py-3 text-right text-sm font-semibold">
                {section.label}
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-foreground/50 transition-transform group-data-[state=open]:rotate-180"
                />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="border-t border-foreground/10 px-4 py-4">
              {section.content}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
