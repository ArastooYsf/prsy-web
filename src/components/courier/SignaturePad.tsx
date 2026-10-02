"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePadLib from "signature_pad";
import { Eraser, CheckCircle } from "lucide-react";

export default function SignaturePad({
  onSubmit,
  submitting,
}: {
  onSubmit: (blob: Blob) => void;
  submitting: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Canvas backing-store size must match its CSS size * devicePixelRatio
    // or strokes render blurry/offset on high-DPI phone screens — signature_pad
    // doesn't do this itself, every integration has to.
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);

    const pad = new SignaturePadLib(canvas, { backgroundColor: "rgb(255, 255, 255)" });
    pad.addEventListener("endStroke", () => setEmpty(pad.isEmpty()));
    padRef.current = pad;

    return () => pad.off();
  }, []);

  const clear = () => {
    padRef.current?.clear();
    setEmpty(true);
  };

  const submit = async () => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    const dataUrl = pad.toDataURL("image/png");
    const blob = await (await fetch(dataUrl)).blob();
    onSubmit(blob);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-foreground/60">لطفاً از گیرنده بخواهید در کادر زیر امضا کند.</p>
      <canvas
        ref={canvasRef}
        className="h-40 w-full touch-none rounded-lg border border-foreground/10 bg-white"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={clear}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <Eraser className="size-3.5" />
          پاک کردن
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={empty || submitting}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-4 text-xs font-semibold text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle className="size-3.5" />
          {submitting ? "در حال ثبت..." : "ثبت امضا و پایان تحویل"}
        </button>
      </div>
    </div>
  );
}
