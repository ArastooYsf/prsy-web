"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { getMediaUrl } from "@/lib/media";

type Slide = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
};

const SLIDES: Slide[] = [
  {
    id: "diesel-generators",
    title: "دیزل ژنراتور صنعتی و تجاری",
    description:
      "تأمین انواع دیزل ژنراتور در ظرفیت‌های مختلف، با برندهای معتبر جهانی؛ به‌صورت نو و دست‌دوم.",
    ctaLabel: "مشاهده محصول",
    ctaHref: "/products#diesel-generators",
    image: "products/diesel-generators.svg",
  },
  {
    id: "power-engines",
    title: "موتور برق خانگی و تجاری",
    description:
      "موتور برق‌های قابل‌حمل و ثابت، مناسب مصارف خانگی و تجاری، با گارانتی و پشتیبانی کامل.",
    ctaLabel: "مشاهده محصول",
    ctaHref: "/products#power-engines",
    image: "products/power-engines.svg",
  },
  {
    id: "spare-parts",
    title: "قطعات یدکی اورجینال",
    description:
      "تأمین قطعات یدکی اورجینال برای انواع دیزل ژنراتور و موتور برق، فقط به‌صورت نو.",
    ctaLabel: "بیشتر بدانید",
    ctaHref: "/products#spare-parts",
    image: "products/spare-parts.svg",
  },
  {
    id: "overhaul",
    title: "خدمات اورهال و تعمیرات",
    description:
      "اورهال و تعمیرات تخصصی دیزل ژنراتور و موتور برق، توسط تیم فنی مجرب.",
    ctaLabel: "بیشتر بدانید",
    ctaHref: "/products#overhaul",
    image: "products/overhaul.svg",
  },
];

const SLIDE_DURATION = 5;

type HeroOverride = {
  title?: string;
  description?: string;
  image?: string;
};

type HeroProps = {
  overrides?: Record<string, HeroOverride>;
};

export default function Hero({ overrides = {} }: HeroProps) {
  const [index, setIndex] = useState(0);
  const [imageHovered, setImageHovered] = useState(false);
  const [textHovered, setTextHovered] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  const slides = SLIDES.map((s) => {
    const override = overrides[s.id];
    return {
      ...s,
      title: override?.title || s.title,
      description: override?.description || s.description,
      image: override?.image || s.image,
    };
  });

  const slide = slides[index];
  const imageFirst = index % 2 === 0;

  const goNext = () => {
    setIndex((i) => (i + 1) % slides.length);
    setImageHovered(false);
    setTextHovered(false);
  };

  const goTo = (i: number) => {
    setIndex(i);
    setImageHovered(false);
    setTextHovered(false);
  };

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-20 sm:py-28 lg:min-h-[calc(100vh-3rem)]">
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
                className={`relative order-1 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] shadow-2xl shadow-black/20 ring-1 ring-white/5 sm:aspect-[16/10] lg:aspect-square ${
                  imageFirst ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <img
                  src={getMediaUrl(slide.image)}
                  alt={slide.title}
                  className="h-full w-full object-contain p-10 sm:p-14"
                />
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
                <h1 className="text-balance text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                  {slide.title}
                </h1>
                <p className="mt-4 text-balance leading-8 text-foreground/70 sm:text-lg">
                  {slide.description}
                </p>
                <Link
                  href={slide.ctaHref}
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/30 sm:text-base"
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
              </motion.div>
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
              className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10"
            >
              {i < index && (
                <span className="absolute inset-0 bg-accent-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              )}
              {i === index && (
                <motion.span
                  key={`${s.id}-${index}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: SLIDE_DURATION, ease: "linear" }}
                  onAnimationComplete={goNext}
                  style={{ transformOrigin: "right" }}
                  className="absolute inset-0 bg-accent-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
