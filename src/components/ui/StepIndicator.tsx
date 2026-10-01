import { Check } from "lucide-react";
import { toPersianDigits } from "@/lib/format-number";

type StepIndicatorProps = {
  steps: string[];
  /** 1-indexed current step. */
  currentStep: number;
  /**
   * Called with a step's 1-indexed number when its circle is clicked.
   * Only offered for completed steps (< currentStep) — the current step and
   * any step ahead of it aren't clickable, since a not-yet-reached step's
   * data isn't filled in yet. Omit to render a non-interactive indicator.
   */
  onStepClick?: (step: number) => void;
};

// Numbered circles connected by a line — same visual language as
// OrderProgress (src/components/account/OrderProgress.tsx). Shared by every
// multi-step flow (registration, checkout, ...) so they all read as the same
// wizard pattern rather than independently-styled steppers.
//
// Both flex rows below use items-start rather than items-center, on
// purpose: with items-center, a step's own row height is set by its tallest
// content (circle + gap + label), so a label that wraps to 2-3 lines grows
// that row — and items-center then centers the *connecting line* against
// that whole taller row instead of against the circle, and centers
// *shorter neighboring steps* against this one's extra height too, pulling
// every circle and line off the shared horizontal guideline. items-start
// pins the circle (and the line, offset to the circle's own mid-height via
// mt-[13px] = h-7/2 - h-0.5/2) to a fixed y regardless of label height, and
// leaves the label free to wrap without moving anything above it.
export default function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <div className="mb-7 flex items-start" aria-label={`مرحله ${toPersianDigits(currentStep)} از ${toPersianDigits(steps.length)}`}>
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        const isLast = index === steps.length - 1;
        // Only a completed step is safe to jump back to — its data was
        // already filled in on the way forward. The current step is already
        // where the user is, and a future step's data doesn't exist yet.
        const clickable = done && !!onStepClick;
        const circleClassName = `flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-300 ${
          done || active
            ? "border-accent-500 bg-accent-500 text-primary-foreground"
            : "border-foreground/15 bg-foreground/5 text-foreground/40"
        } ${clickable ? "cursor-pointer hover:brightness-110" : ""}`;
        return (
          <div key={label} className="flex flex-1 items-start last:flex-none">
            <div className="flex flex-col items-center gap-2">
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(stepNum)}
                  aria-label={`بازگشت به مرحله ${toPersianDigits(stepNum)}: ${label}`}
                  className={circleClassName}
                >
                  <Check className="size-3.5" />
                </button>
              ) : (
                <span className={circleClassName}>
                  {done ? <Check className="size-3.5" /> : toPersianDigits(stepNum)}
                </span>
              )}
              <span className={`text-center text-[11px] ${done || active ? "text-accent-400" : "text-foreground/40"}`}>
                {label}
              </span>
            </div>
            {!isLast && (
              <span
                className={`mx-2 mt-[13px] h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  done ? "bg-accent-500" : "bg-foreground/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
