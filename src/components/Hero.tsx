"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getMediaUrl } from "@/lib/media";
import { DEFAULT_HERO_SLIDES, type HeroSlideContent } from "@/lib/site-content-defaults";
import { useLandingTheme } from "@/components/RouteThemeScope";
import { cn } from "@/lib/utils";

const SLIDE_DURATION = 5;

type HeroProps = {
  slides?: HeroSlideContent[];
};

export default function Hero({ slides: slidesProp }: HeroProps) {
  const [index, setIndex] = useState(0);
  // Hero only ever renders on "/", but that route's own palette is now
  // toggleable (see RouteThemeScope) rather than permanently light, so the
  // two things Tailwind classes alone can't theme-switch — the typography
  // plugin's prose/prose-invert and the grid background's line color — need
  // to read the live theme instead of assuming light.
  const isDark = useLandingTheme()?.theme === "dark";

  const slides = slidesProp && slidesProp.length > 0 ? slidesProp : DEFAULT_HERO_SLIDES;

  const slide = slides[index];

  const goNext = () => {
    setIndex((i) => (i + 1) % slides.length);
  };

  const goTo = (i: number) => {
    setIndex(i);
  };

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-20 sm:py-28 lg:min-h-[calc(100vh-3rem)]">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]",
          isDark ? "bg-grid-pattern" : "bg-grid-pattern-dark",
        )}
      />

      <div className="container relative z-10">
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16"
            >
              <div className="relative order-1 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] sm:aspect-[16/10] lg:order-1 lg:aspect-square">
                <span aria-hidden className="absolute right-3 top-3 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-foreground/20" />
                <span aria-hidden className="absolute left-3 top-3 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-foreground/20" />
                <span aria-hidden className="absolute bottom-3 right-3 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-foreground/20" />
                <span aria-hidden className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-foreground/20" />
                {slide.image && (
                  <Image
                    src={getMediaUrl(slide.image)}
                    alt={slide.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    priority={index === 0}
                    className="object-contain p-10 sm:p-14"
                  />
                )}
              </div>

              <div className="order-2 text-center lg:order-2 lg:text-right">
                <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                  {slide.title}
                </h1>
                <div
                  className={cn(
                    "prose prose-sm mt-4 max-w-none text-balance leading-8 text-foreground/70 sm:text-lg [&_p]:m-0",
                    isDark && "prose-invert",
                  )}
                  dangerouslySetInnerHTML={{ __html: slide.description }}
                />
                <Link
                  href={slide.ctaHref}
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg hover:shadow-accent-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-base"
                >
                  {slide.ctaLabel}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0 transition-transform duration-300 group-hover:-translate-x-1"
                  >
                    <path
                      d="M19 12H5M5 12L11 6M5 12L11 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mx-auto mt-10 flex max-w-md items-center gap-2 lg:mt-14">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`رفتن به اسلاید ${s.title}`}
              aria-current={i === index}
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {i < index && (
                <span className="absolute inset-0 bg-accent-500" />
              )}
              {i === index && (
                <motion.span
                  key={`${s.id}-${index}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: SLIDE_DURATION, ease: "linear" }}
                  onAnimationComplete={goNext}
                  style={{ transformOrigin: "right" }}
                  className="absolute inset-0 bg-accent-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <motion.a
        href="#why-us"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        aria-label="مشاهده‌ی ادامه‌ی محتوا"
        className="absolute inset-x-0 bottom-3 z-10 mx-auto flex w-fit flex-col items-center gap-1 text-foreground/40 transition-colors hover:text-foreground/70 sm:bottom-4"
      >
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </motion.a>
    </section>
  );
}
