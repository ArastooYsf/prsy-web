"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

type Slide = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  icon: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    id: "diesel-generators",
    title: "دیزل ژنراتور صنعتی و تجاری",
    description:
      "تأمین انواع دیزل ژنراتور در ظرفیت‌های مختلف، با برندهای معتبر جهانی؛ به‌صورت نو و دست‌دوم.",
    ctaLabel: "مشاهده محصول",
    ctaHref: "/products#diesel-generators",
    icon: (
      <svg width="132" height="132" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="7" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
        <path
          d="M11.5 10.5l-3 3.6h2.1l-1 2.9 3.4-3.6h-2l0.5-2.9z"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        <path d="M19 10h2M19 14h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "power-engines",
    title: "موتور برق خانگی و تجاری",
    description:
      "موتور برق‌های قابل‌حمل و ثابت، مناسب مصارف خانگی و تجاری، با گارانتی و پشتیبانی کامل.",
    ctaLabel: "مشاهده محصول",
    ctaHref: "/products#power-engines",
    icon: (
      <svg width="132" height="132" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 11h10v3a5 5 0 01-5 5 5 5 0 01-5-5v-3z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path d="M9 7v4M15 7v4M12 19v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "spare-parts",
    title: "قطعات یدکی اورجینال",
    description:
      "تأمین قطعات یدکی اورجینال برای انواع دیزل ژنراتور و موتور برق، فقط به‌صورت نو.",
    ctaLabel: "بیشتر بدانید",
    ctaHref: "/products#spare-parts",
    icon: (
      <svg width="132" height="132" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1" />
        <path
          d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "overhaul",
    title: "خدمات اورهال و تعمیرات",
    description:
      "اورهال و تعمیرات تخصصی دیزل ژنراتور و موتور برق، توسط تیم فنی مجرب.",
    ctaLabel: "بیشتر بدانید",
    ctaHref: "/products#overhaul",
    icon: (
      <svg width="132" height="132" viewBox="0 0 24 24" fill="none">
        <path
          d="M14.7 6.3a4 4 0 00-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 005.4-5.4l-2.8 2.8-2-2 2.8-2.8z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const SLIDE_DURATION = 5;

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [imageHovered, setImageHovered] = useState(false);
  const [textHovered, setTextHovered] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  const slide = SLIDES[index];
  const imageFirst = index % 2 === 0;

  const goNext = () => {
    setIndex((i) => (i + 1) % SLIDES.length);
    setImageHovered(false);
    setTextHovered(false);
  };

  const goTo = (i: number) => {
    setIndex(i);
    setImageHovered(false);
    setTextHovered(false);
  };

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-20 sm:py-28 md:min-h-[calc(100vh-3rem)]">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-accent-500/15 blur-[110px] sm:h-[560px] sm:w-[560px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] left-[-10%] h-[380px] w-[380px] rounded-full bg-brand-500/15 blur-[110px] sm:h-[500px] sm:w-[500px]"
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
              <motion.div
                onHoverStart={() => canHover && setImageHovered(true)}
                onHoverEnd={() => canHover && setImageHovered(false)}
                animate={{
                  scale: imageHovered ? 1.06 : 1,
                  opacity: textHovered ? 0.7 : 1,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`relative order-1 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] text-accent-400/70 sm:aspect-[16/10] lg:aspect-square ${
                  imageFirst ? "lg:order-2" : "lg:order-1"
                }`}
              >
                {slide.icon}
              </motion.div>

              <motion.div
                onHoverStart={() => canHover && setTextHovered(true)}
                onHoverEnd={() => canHover && setTextHovered(false)}
                animate={{
                  opacity: imageHovered ? 0.5 : 1,
                  filter: textHovered ? "brightness(1.1)" : "brightness(1)",
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`order-2 text-center lg:text-right ${
                  imageFirst ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <h1 className="text-balance text-3xl font-black leading-tight sm:text-5xl">
                  {slide.title}
                </h1>
                <p className="mt-4 text-balance leading-8 text-foreground/70 sm:text-lg">
                  {slide.description}
                </p>
                <Link
                  href={slide.ctaHref}
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 sm:text-base"
                >
                  {slide.ctaLabel}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path
                      d="M19 12H5M5 12L11 6M5 12L11 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mx-auto mt-10 flex max-w-md items-center gap-2 lg:mt-14">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`رفتن به اسلاید ${s.title}`}
              aria-current={i === index}
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10"
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
    </section>
  );
}
