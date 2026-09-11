"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getMediaUrl } from "@/lib/media";
import { DEFAULT_HERO_SLIDES, type HeroSlideContent } from "@/lib/site-content-defaults";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";

const SLIDE_DURATION = 5;
// Shared by the background and text AnimatePresence trees below so their
// fades stay in lockstep — they can't be one motion.div because the text's
// y-offset animation would add a `transform` on its ancestor and break the
// background image's `absolute inset-0` full-bleed sizing (transform creates
// a new containing block).
const SLIDE_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

type HeroProps = {
  slides?: HeroSlideContent[];
};

export default function Hero({ slides: slidesProp }: HeroProps) {
  const [index, setIndex] = useState(0);

  const slides = slidesProp && slidesProp.length > 0 ? slidesProp : DEFAULT_HERO_SLIDES;

  const slide = slides[index];

  const goNext = () => {
    setIndex((i) => (i + 1) % slides.length);
  };

  const goTo = (i: number) => {
    setIndex(i);
  };

  return (
    <section className="group relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-20 sm:py-28 lg:min-h-[calc(100vh-3rem)]">
      {/* Full-bleed slide background: the slide image itself (cropped via
          object-cover) is the hero's background, with a dark overlay for
          guaranteed text contrast regardless of what the admin uploads. A
          single transparent link spans the whole slide so clicking anywhere
          on it — not just the visible CTA button below — goes to the same
          place; the visible title/description stay real page content (not
          swallowed into the link's accessible name) and let clicks fall
          through via pointer-events-none on their wrapper. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SLIDE_TRANSITION}
          className="absolute inset-0"
        >
          {slide.image ? (
            <Image
              src={getMediaUrl(slide.image)}
              alt=""
              fill
              sizes="100vw"
              priority={index === 0}
              className="object-cover"
            />
          ) : (
            <ThemedGridBackdrop />
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />
          <Link
            href={slide.ctaHref}
            aria-label={`${slide.title} — ${slide.ctaLabel}`}
            className="absolute inset-0 focus:outline-none"
          />
        </motion.div>
      </AnimatePresence>

      <div className="container relative z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={SLIDE_TRANSITION}
            className="mx-auto max-w-2xl text-center text-white"
          >
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              {slide.title}
            </h1>
            <div
              className="prose prose-invert prose-sm mt-4 max-w-none text-balance leading-8 text-white/85 sm:text-lg [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: slide.description }}
            />
            <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-black/30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-primary/90 group-focus-within:ring-2 group-focus-within:ring-white group-focus-within:ring-offset-2 group-focus-within:ring-offset-black/50 sm:text-base">
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
            </span>
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-auto mx-auto mt-10 flex max-w-md items-center gap-2 lg:mt-14">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`رفتن به اسلاید ${s.title}`}
              aria-current={i === index}
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {i < index && <span className="absolute inset-0 bg-accent-500" />}
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
        className="absolute inset-x-0 bottom-3 z-10 mx-auto flex w-fit flex-col items-center gap-1 text-white/60 transition-colors hover:text-white sm:bottom-4"
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
