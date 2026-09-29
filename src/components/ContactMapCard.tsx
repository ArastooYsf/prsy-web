"use client";

import { useState } from "react";
import { MapPin, ArrowUpRight } from "@phosphor-icons/react";
import ThemedMapFrame from "@/components/ui/ThemedMapFrame";
import { cn } from "@/lib/utils";

type MapProviderId = "neshan" | "balad" | "google";

type MapProvider = {
  id: MapProviderId;
  label: string;
  buildHref: (query: string) => string;
};

// Verified by hand against each provider's live web app (2026-09-20):
// - Google and Neshan both read a plain text address (or "lat,lng") from
//   their `?q=`/`/search/` route and run a real search against it.
// - Balad's public site has no equivalent — typing an address into its own
//   search box resolves through a private, unversioned API and lands on a
//   place-id permalink, not a URL we can construct from address text alone.
//   `?q=` is included anyway (harmless, forward-compatible) but currently
//   just opens Balad's search page for the visitor to search manually.
const MAP_PROVIDERS: MapProvider[] = [
  { id: "neshan", label: "نشان", buildHref: (query) => `https://neshan.org/maps/search/${encodeURIComponent(query)}` },
  { id: "balad", label: "بلد", buildHref: (query) => `https://balad.ir/search?q=${encodeURIComponent(query)}` },
  { id: "google", label: "گوگل‌مپ", buildHref: (query) => `https://www.google.com/maps?q=${encodeURIComponent(query)}` },
];

// "lat,lng" e.g. "35.7219, 51.3347" — the coordinate form of the admin's
// optional mapUrl override. Anything else non-empty is treated as a raw,
// already-complete map link and used as-is.
const COORDINATES_RE = /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/;

export default function ContactMapCard({ address, mapLabel, mapUrl }: { address: string; mapLabel: string; mapUrl?: string }) {
  const [providerId, setProviderId] = useState<MapProviderId>("neshan");
  const override = mapUrl?.trim() || "";
  const isCoordinates = override !== "" && COORDINATES_RE.test(override);
  const isRawLink = override !== "" && !isCoordinates;

  const provider = MAP_PROVIDERS.find((p) => p.id === providerId) ?? MAP_PROVIDERS[0];
  const href = isRawLink ? override : provider.buildHref(isCoordinates ? override : address);
  const embedSrc = isRawLink ? override : `https://www.google.com/maps?q=${encodeURIComponent(isCoordinates ? override : address)}&output=embed`;

  return (
    <div className="mx-auto max-w-2xl">
      {/* A raw pasted link isn't tied to one of these three providers, so
          switching tabs wouldn't change where it points — hide the switcher. */}
      {!isRawLink && (
        <div
          role="tablist"
          aria-label="انتخاب سرویس نقشه"
          className="mb-3 flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] p-1"
        >
          {MAP_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === providerId}
              onClick={() => setProviderId(p.id)}
              className={cn(
                "min-h-11 flex-1 rounded-full px-3 text-xs font-semibold transition-colors sm:text-sm",
                p.id === providerId
                  ? "bg-accent-500 text-primary-foreground"
                  : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={isRawLink ? "باز کردن موقعیت شرکت در نقشه" : `باز کردن موقعیت شرکت در ${provider.label}`}
        className="group block overflow-hidden rounded-2xl border border-foreground/10 transition-colors hover:border-accent-500/40"
      >
        <ThemedMapFrame title={mapLabel} src={embedSrc} className="h-64 w-full pointer-events-none sm:h-72" />
        <span className="flex items-center justify-center gap-1.5 border-t border-foreground/10 bg-foreground/[0.03] py-2.5 text-xs font-semibold text-foreground/70 transition-colors group-hover:text-accent-400 sm:text-sm">
          <MapPin size={14} weight="bold" aria-hidden />
          مشاهده‌ی موقعیت {isRawLink ? "در نقشه" : `در ${provider.label}`}
          <ArrowUpRight size={14} weight="bold" aria-hidden />
        </span>
      </a>
    </div>
  );
}
