import { Check } from "lucide-react";

const STEPS = ["نوع حساب", "اطلاعات فردی", "ایمیل و رمز عبور"];

type RegisterStepperProps = {
  /** 1-indexed current step. */
  currentStep: number;
};

// Numbered circles connected by a line — same visual language as
// OrderProgress (src/components/OrderProgress.tsx), adapted for a form
// wizard: a step is "done" once the user has moved past it, not tied to a
// server-side status.
export default function RegisterStepper({ currentStep }: RegisterStepperProps) {
  return (
    <div className="mb-7 flex items-center" aria-label={`مرحله ${currentStep} از ${STEPS.length}`}>
      {STEPS.map((label, index) => {
        const stepNum = index + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        const isLast = index === STEPS.length - 1;
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
                {done ? <Check className="size-3.5" /> : stepNum}
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
