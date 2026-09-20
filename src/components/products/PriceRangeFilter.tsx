"use client";

import { useEffect, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { formatNumber } from "@/lib/format-number";

type PriceRangeFilterProps = {
  bounds: { min: number; max: number };
  min: number;
  max: number;
  /** Fires once per finished interaction (drag release, blur, or Enter) — never on every intermediate value. */
  onCommit: (min: number, max: number) => void;
};

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-2.5 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent-500/50";

// Every product price in this catalog is entered as a round multiple of
// 1,000,000 toman (28M, 45M, 62M, 320M, ...) — so a 1,000,000 step lets the
// slider land on every real price exactly, without ever settling on an ugly
// in-between number, and without being finer than the data actually is.
const PRICE_STEP = 1_000_000;

export default function PriceRangeFilter({ bounds, min, max, onCommit }: PriceRangeFilterProps) {
  // The slider needs live values while dragging (before the drag ends); the
  // number inputs need their own editable string state so a user can clear a
  // field or type a partial number ("1", "15") without it being clamped or
  // reformatted on every keystroke. Both resync from `min`/`max` whenever the
  // committed value changes from outside (e.g. the other control, or the URL).
  const [range, setRange] = useState<[number, number]>([min, max]);
  const [minText, setMinText] = useState(String(min));
  const [maxText, setMaxText] = useState(String(max));
  // Which thumb shows its live-value tooltip: whichever is being dragged, or
  // (with nothing being dragged) whichever is hovered.
  const [hoverThumb, setHoverThumb] = useState<0 | 1 | null>(null);
  const [dragThumb, setDragThumb] = useState<0 | 1 | null>(null);
  const tooltipThumb = dragThumb ?? hoverThumb;

  useEffect(() => {
    setRange([min, max]);
    setMinText(String(min));
    setMaxText(String(max));
  }, [min, max]);

  // A pointerdown on a thumb can end (pointerup) anywhere on the page once
  // dragging — not necessarily back over the thumb — so releasing has to be
  // caught globally rather than via the thumb's own handlers.
  useEffect(() => {
    if (dragThumb === null) return;
    const clear = () => setDragThumb(null);
    window.addEventListener("pointerup", clear);
    return () => window.removeEventListener("pointerup", clear);
  }, [dragThumb]);

  const clamp = (value: number) => Math.min(Math.max(value, bounds.min), bounds.max);

  // The field the user just finished editing always wins — if it crosses the
  // other bound, that other bound moves to match instead of the typed value
  // being silently clamped away (e.g. typing a max below the current min
  // must not just snap back to the old min with no visible effect).
  const commitMinText = () => {
    const parsed = Number(minText);
    const nextMin = Number.isFinite(parsed) ? clamp(parsed) : range[0];
    const nextMax = Math.max(nextMin, range[1]);
    setMinText(String(nextMin));
    setMaxText(String(nextMax));
    setRange([nextMin, nextMax]);
    onCommit(nextMin, nextMax);
  };

  const commitMaxText = () => {
    const parsed = Number(maxText);
    const nextMax = Number.isFinite(parsed) ? clamp(parsed) : range[1];
    const nextMin = Math.min(range[0], nextMax);
    setMinText(String(nextMin));
    setMaxText(String(nextMax));
    setRange([nextMin, nextMax]);
    onCommit(nextMin, nextMax);
  };

  return (
    <div>
      <Slider.Root
        className="relative mt-9 flex h-5 w-full touch-none select-none items-center"
        dir="ltr"
        min={bounds.min}
        max={bounds.max}
        step={PRICE_STEP}
        value={range}
        onValueChange={(v) => setRange([v[0], v[1]])}
        onValueCommit={(v) => {
          setMinText(String(v[0]));
          setMaxText(String(v[1]));
          onCommit(v[0], v[1]);
        }}
      >
        <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-foreground/10">
          <Slider.Range className="absolute h-full rounded-full bg-accent-500" />
        </Slider.Track>
        {([0, 1] as const).map((i) => (
          <Slider.Thumb
            key={i}
            aria-label={i === 0 ? "کمترین قیمت" : "بیشترین قیمت"}
            onPointerEnter={() => setHoverThumb(i)}
            onPointerLeave={() => setHoverThumb((h) => (h === i ? null : h))}
            onPointerDown={() => setDragThumb(i)}
            className="relative block size-5 rounded-full border-2 border-accent-500 bg-background shadow transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40"
          >
            {tooltipThumb === i && (
              <span
                dir="ltr"
                className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[11px] font-semibold text-background shadow-lg"
              >
                {formatNumber(range[i])}
              </span>
            )}
          </Slider.Thumb>
        ))}
      </Slider.Root>

      <div className="mt-3 flex items-center gap-2" dir="ltr">
        <input
          type="number"
          inputMode="numeric"
          value={minText}
          onChange={(e) => setMinText(e.target.value)}
          onBlur={commitMinText}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="کمترین قیمت (تومان)"
          className={inputClass}
        />
        <span className="shrink-0 text-foreground/40">تا</span>
        <input
          type="number"
          inputMode="numeric"
          value={maxText}
          onChange={(e) => setMaxText(e.target.value)}
          onBlur={commitMaxText}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="بیشترین قیمت (تومان)"
          className={inputClass}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-foreground/40" dir="ltr">
        <span>{formatNumber(bounds.min)}</span>
        <span>{formatNumber(bounds.max)}</span>
      </div>
    </div>
  );
}
