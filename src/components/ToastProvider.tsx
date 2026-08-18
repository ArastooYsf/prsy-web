"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
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

const TYPE_STYLES: Record<ToastType, { border: string; text: string; shadow: string; Icon: typeof CheckCircle2 }> = {
  success: {
    border: "border-accent-500/30",
    text: "text-accent-400",
    shadow: "shadow-accent-500/10",
    Icon: CheckCircle2,
  },
  error: {
    border: "border-red-500/30",
    text: "text-red-400",
    shadow: "shadow-red-500/10",
    Icon: AlertCircle,
  },
  warning: {
    border: "border-amber-500/30",
    text: "text-amber-400",
    shadow: "shadow-amber-500/10",
    Icon: AlertTriangle,
  },
  info: {
    border: "border-sky-500/30",
    text: "text-sky-400",
    shadow: "shadow-sky-500/10",
    Icon: Info,
  },
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => {
            const { border, text, shadow, Icon } = TYPE_STYLES[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`pointer-events-auto flex items-center gap-2.5 rounded-full border bg-background/95 px-5 py-3 text-sm font-medium shadow-2xl backdrop-blur-sm ${border} ${text} ${shadow}`}
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
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
