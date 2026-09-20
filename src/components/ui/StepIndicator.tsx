import { Check } from "lucide-react";
import { toPersianDigits } from "@/lib/format-number";

type StepIndicatorProps = {
  steps: string[];
  /** 1-indexed current step. */
  currentStep: number;
};

// Numbered circles connected by a line — same visual language as
// OrderProgress (src/components/OrderProgress.tsx). Shared by every
// multi-step flow (registration, checkout, ...) so they all read as the same
// wizard pattern rather than independently-styled steppers.
export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-7 flex items-center" aria-label={`مرحله ${toPersianDigits(currentStep)} از ${toPersianDigits(steps.length)}`}>
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        const isLast = index === steps.length - 1;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-300 ${
                  done || active
                    ? "border-accent-500 bg-accent-500 text-primary-foreground"
                    : "border-foreground/15 bg-foreground/5 text-foreground/40"
                }`}
              >
                {done ? <Check className="size-3.5" /> : toPersianDigits(stepNum)}
              </span>
              <span className={`text-[11px] ${done || active ? "text-accent-400" : "text-foreground/40"}`}>
                {label}
              </span>
            </div>
            {!isLast && (
              <span
                className={`mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
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
