"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";
type ToastItem = { id: number; message: string; type: ToastType };

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const DEFAULT_DURATION = 4000;

const TYPE_STYLES: Record<ToastType, { border: string; text: string; shadow: string; bar: string; Icon: typeof CheckCircle2 }> = {
  success: {
    border: "border-accent-500/30",
    text: "text-accent-400",
    shadow: "shadow-accent-500/10",
    bar: "bg-accent-500",
    Icon: CheckCircle2,
  },
  error: {
    border: "border-red-500/30",
    text: "text-red-400",
    shadow: "shadow-red-500/10",
    bar: "bg-red-500",
    Icon: AlertCircle,
  },
  warning: {
    border: "border-amber-500/30",
    text: "text-amber-400",
    shadow: "shadow-amber-500/10",
    bar: "bg-amber-500",
    Icon: AlertTriangle,
  },
  info: {
    border: "border-sky-500/30",
    text: "text-sky-400",
    shadow: "shadow-sky-500/10",
    bar: "bg-sky-500",
    Icon: Info,
  },
};

// What can hold a toast paused. Mouse hover and keyboard focus land on the
// same element and can genuinely overlap (tab to the close button without
// the mouse having left the toast, or vice versa) — tracking *which* reasons
// are active, not just a single paused/running flag, is what lets the two
// compose correctly instead of one ending early because the other let go.
type PauseReason = "hover" | "focus";

// Per-toast auto-dismiss bookkeeping, keyed by id. Lives in a ref (not state)
// since pause/resume mutate it on every hover/focus without needing a
// re-render of their own — only `pausedIds` (which flips the progress bar's
// animation-play-state) needs to be React state.
type TimerEntry = { timeoutId: ReturnType<typeof setTimeout>; startedAt: number; remaining: number; pauseReasons: Set<PauseReason> };

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pausedIds, setPausedIds] = useState<Set<number>>(new Set());
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, TimerEntry>>(new Map());

  const removeFromPaused = useCallback((id: number) => {
    setPausedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer.timeoutId);
        timersRef.current.delete(id);
      }
      setToasts((prev) => prev.filter((t) => t.id !== id));
      removeFromPaused(id);
    },
    [removeFromPaused],
  );

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      const timeoutId = setTimeout(() => dismiss(id), DEFAULT_DURATION);
      timersRef.current.set(id, { timeoutId, startedAt: Date.now(), remaining: DEFAULT_DURATION, pauseReasons: new Set() });
    },
    [dismiss],
  );

  // Pause: drop the pending dismiss and bank whatever time was left, so a
  // later resume picks up from exactly where the interruption happened —
  // neither a fresh full duration nor an immediate dismiss. A reason already
  // holding the toast paused is a no-op: a second overlapping pause must not
  // re-clear the timer or re-subtract elapsed time against a stale `startedAt`.
  const pauseToast = useCallback((id: number, reason: PauseReason) => {
    const timer = timersRef.current.get(id);
    if (!timer) return;
    const wasPaused = timer.pauseReasons.size > 0;
    timer.pauseReasons.add(reason);
    if (wasPaused) return;
    clearTimeout(timer.timeoutId);
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
    setPausedIds((prev) => new Set(prev).add(id));
  }, []);

  // Resume only once every reason that paused it has let go — if the mouse
  // leaves while the close button still has keyboard focus, the toast must
  // stay paused for the focus that's still active.
  const resumeToast = useCallback(
    (id: number, reason: PauseReason) => {
      const timer = timersRef.current.get(id);
      if (!timer) return;
      timer.pauseReasons.delete(reason);
      if (timer.pauseReasons.size > 0) return;
      timer.startedAt = Date.now();
      timer.timeoutId = setTimeout(() => dismiss(id), timer.remaining);
      removeFromPaused(id);
    },
    [dismiss, removeFromPaused],
  );

  // Belt-and-suspenders: clears any still-pending dismiss timers if the
  // provider itself ever unmounts, rather than letting them fire against a
  // gone component.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer.timeoutId);
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => {
            const { border, text, shadow, bar, Icon } = TYPE_STYLES[t.type];
            const paused = pausedIds.has(t.id);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onMouseEnter={() => pauseToast(t.id, "hover")}
                onMouseLeave={() => resumeToast(t.id, "hover")}
                // A mouse hover isn't the only way to be "interacting" with a
                // toast — tabbing to its close button should get the same
                // grace period, or a keyboard user's countdown keeps running
                // invisibly while a mouse user's doesn't.
                onFocus={() => pauseToast(t.id, "focus")}
                onBlur={() => resumeToast(t.id, "focus")}
                className={`pointer-events-auto relative flex items-center gap-2.5 overflow-hidden rounded-2xl border bg-background/95 px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-sm ${border} ${text} ${shadow}`}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={2} />
                <span>{t.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="بستن"
                  className="mr-1 text-foreground/40 transition-colors hover:text-foreground/70"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 h-[3px] origin-right ${bar}`}
                  style={{
                    animationName: "toast-progress",
                    animationDuration: `${DEFAULT_DURATION}ms`,
                    animationTimingFunction: "linear",
                    animationFillMode: "forwards",
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
