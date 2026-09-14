"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { getMediaUrl } from "@/lib/media";

export type ProductGalleryProps = {
  images: string[];
  alt: string;
};

const SLIDE_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

const slideVariants: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -32 : 32, opacity: 0 }),
};

const arrowButtonClass =
  "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 hover:bg-black/60 focus-visible:opacity-100 group-hover:opacity-100";

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  // The index actually on screen: a hovered thumbnail previews instantly
  // without committing navigation, matching how a hover-preview thumbnail
  // rail behaves — moving the mouse away reverts to the last clicked image.
  const displayedIndex = previewIndex ?? activeIndex;

  const goTo = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
    setPreviewIndex(null);
  };
  const showPrev = () => goTo((activeIndex - 1 + images.length) % images.length);
  const showNext = () => goTo((activeIndex + 1) % images.length);

  // Tracks which mobile slide is on-screen via IntersectionObserver rather
  // than reading scrollLeft: browsers disagree on the sign of scrollLeft in
  // RTL containers, so deriving the active index from it would misfire in
  // at least one engine. Intersection ratio is direction-agnostic.
  useEffect(() => {
    const track = mobileTrackRef.current;
    if (!track || images.length < 2) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // This track is always in the DOM (the desktop layout just hides it
        // via `lg:hidden`), and an IntersectionObserver rooted in a
        // display:none container reports unreliable ratios — checked live on
        // every callback (not once at effect setup) since the container can
        // flip between hidden/visible after a viewport resize.
        if (track.offsetParent === null) return;
        const mostVisible = entries.reduce(
          (best, entry) => (entry.intersectionRatio > best.intersectionRatio ? entry : best),
          entries[0],
        );
        if (mostVisible.intersectionRatio > 0.5) {
          const index = slideRefs.current.findIndex((el) => el === mostVisible.target);
          if (index !== -1) setActiveIndex(index);
        }
      },
      { root: track, threshold: [0.5, 0.75, 1] },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [images.length]);

  // Keeps the active thumbnail visible in the vertical rail when navigation
  // happens via the arrow buttons instead of a direct thumbnail click.
  useEffect(() => {
    thumbRefs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeIndex]);

  // Left/right arrow keys move through the images while the lightbox is
  // open, matching the keyboard behavior of a real image viewer.
  useEffect(() => {
    if (!lightboxOpen || images.length < 2) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") showNext();
      else if (e.key === "ArrowRight") showPrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, activeIndex, images.length]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    slideRefs.current[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5">
        <ImageOff className="size-12 text-foreground/25" aria-hidden />
      </div>
    );
  }

  const displayedImage = images[displayedIndex] ?? images[0];

  return (
    <div>
      {/* Desktop: large image with a vertical thumbnail rail beside it */}
      <div className="hidden gap-3 lg:flex">
        <div className="group relative aspect-square w-full flex-1 overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="بزرگ‌نمایی تصویر"
            aria-haspopup="dialog"
            aria-expanded={lightboxOpen}
            className="absolute inset-0"
          >
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={displayedIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={SLIDE_TRANSITION}
                className="absolute inset-0"
              >
                <Image
                  src={getMediaUrl(displayedImage)}
                  alt={alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 32rem, 100vw"
                  className="object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="تصویر قبلی"
                onClick={showPrev}
                className={`${arrowButtonClass} right-3`}
              >
                <ChevronRight className="size-5" />
              </button>
              <button
                type="button"
                aria-label="تصویر بعدی"
                onClick={showNext}
                className={`${arrowButtonClass} left-3`}
              >
                <ChevronLeft className="size-5" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="scrollbar-thin flex w-20 shrink-0 flex-col gap-2 overflow-y-auto">
            {images.map((img, i) => (
              <button
                key={img + i}
                type="button"
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                onClick={() => goTo(i)}
                onMouseEnter={() => setPreviewIndex(i)}
                onMouseLeave={() => setPreviewIndex(null)}
                onFocus={() => setPreviewIndex(i)}
                onBlur={() => setPreviewIndex(null)}
                aria-label={`تصویر ${i + 1}`}
                aria-current={i === displayedIndex ? "true" : undefined}
                className={`relative aspect-square w-full shrink-0 overflow-hidden rounded-lg border transition-colors ${
                  i === displayedIndex ? "border-accent-500" : "border-foreground/10 hover:border-foreground/30"
                }`}
              >
                <Image src={getMediaUrl(img)} alt="" fill sizes="5rem" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: full-width swipeable carousel with dot navigation below */}
      <div className="lg:hidden">
        <div
          ref={mobileTrackRef}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        >
          {images.map((img, i) => (
            <div
              key={img + i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="w-full shrink-0 snap-center"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveIndex(i);
                  setLightboxOpen(true);
                }}
                aria-label={`بزرگ‌نمایی تصویر ${i + 1}`}
                aria-haspopup="dialog"
                aria-expanded={lightboxOpen && activeIndex === i}
                className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5"
              >
                <Image
                  src={getMediaUrl(img)}
                  alt={alt}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-contain"
                />
              </button>
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="تصاویر محصول">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                onClick={() => goToSlide(i)}
                aria-label={`تصویر ${i + 1}`}
                aria-selected={i === activeIndex}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? "w-5 bg-accent-500" : "w-1.5 bg-foreground/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-describedby={undefined}
          >
            <Dialog.Title className="sr-only">{alt}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="بستن"
                className="absolute left-4 top-4 flex size-11 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>

            {images.length > 1 && (
              <button
                type="button"
                aria-label="تصویر قبلی"
                onClick={showPrev}
                className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              >
                <ChevronRight className="size-6" />
              </button>
            )}

            <div className="relative h-[80vh] w-full max-w-4xl overflow-hidden">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={activeIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={SLIDE_TRANSITION}
                  className="absolute inset-0"
                >
                  <Image src={getMediaUrl(images[activeIndex])} alt={alt} fill sizes="90vw" className="object-contain" />
                </motion.div>
              </AnimatePresence>
            </div>

            {images.length > 1 && (
              <button
                type="button"
                aria-label="تصویر بعدی"
                onClick={showNext}
                className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
