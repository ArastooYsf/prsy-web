"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { getMediaUrl } from "@/lib/media";

export type ProductGalleryProps = {
  images: string[];
  alt: string;
};

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5">
        <ImageOff className="size-12 text-foreground/25" />
      </div>
    );
  }

  const showPrev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const showNext = () => setActiveIndex((i) => (i + 1) % images.length);

  return (
    <div>
      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label="بزرگ‌نمایی تصویر"
            className="relative block aspect-square w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5"
          >
            <Image
              src={getMediaUrl(images[activeIndex])}
              alt={alt}
              fill
              priority
              sizes="(min-width: 1024px) 40rem, 100vw"
              className="object-contain"
            />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
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

            <div className="relative h-[80vh] w-full max-w-4xl">
              <Image src={getMediaUrl(images[activeIndex])} alt={alt} fill sizes="90vw" className="object-contain" />
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

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`تصویر ${i + 1}`}
              aria-current={i === activeIndex}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                i === activeIndex ? "border-accent-500" : "border-foreground/10 hover:border-foreground/30"
              }`}
            >
              <Image src={getMediaUrl(img)} alt="" fill sizes="4rem" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
