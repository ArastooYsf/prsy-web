"use client";

import { AnimatePresence, motion } from "framer-motion";
import { scaleIn } from "@/lib/motion";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl border border-foreground/10 bg-background p-5 shadow-2xl"
          >
            <h3 className="text-base font-bold">{title}</h3>
            <p className="mt-2 overflow-y-auto whitespace-pre-line text-sm leading-6 text-foreground/70">{message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-full border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  danger
                    ? "bg-red-500 text-destructive-foreground shadow-red-500/25 hover:bg-red-600"
                    : "bg-accent-500 text-primary-foreground shadow-accent-500/25 hover:bg-accent-600"
                }`}
              >
                {loading ? "..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
