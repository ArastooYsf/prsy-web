import { ORDER_STEPS, orderStepIndex } from "@/lib/status-labels";

export default function OrderProgress({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <p className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-sm font-semibold text-red-400">
        این سفارش لغو شده است
      </p>
    );
  }

  const currentIndex = orderStepIndex(status);

  return (
    <div className="flex items-center">
      {ORDER_STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const isLast = index === ORDER_STEPS.length - 1;
        return (
          <div key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-300 ${
                  done
                    ? "border-accent-500 bg-accent-500 text-white"
                    : "border-white/15 bg-white/5 text-foreground/40"
                }`}
              >
                {index + 1}
              </span>
              <span className={`text-[11px] ${done ? "text-accent-400" : "text-foreground/40"}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <span
                className={`mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  index < currentIndex ? "bg-accent-500" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
