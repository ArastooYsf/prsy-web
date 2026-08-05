"use client";

import { useEffect, useRef, useState } from "react";

type CannedResponse = {
  id: string;
  title: string;
  body: string;
};

export default function CannedResponsePicker({ onSelect }: { onSelect: (body: string) => void }) {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchResponses();
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const fetchResponses = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/canned-responses");
    if (res.ok) {
      const { responses } = await res.json();
      setResponses(responses);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    const res = await fetch("/api/admin/canned-responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, body: newBody }),
    });

    if (res.ok) {
      const { response } = await res.json();
      setResponses((prev) => [response, ...prev]);
      setNewTitle("");
      setNewBody("");
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setResponses((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/admin/canned-responses/${id}`, { method: "DELETE" });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="پیام‌های آماده"
        className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 5.5h16M4 10.5h16M4 15.5h10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-11 right-0 z-20 flex max-h-96 w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold">پیام‌های آماده</p>
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="text-xs font-semibold text-accent-400 hover:text-accent-300"
            >
              {adding ? "انصراف" : "+ افزودن"}
            </button>
          </div>

          {adding && (
            <form onSubmit={handleAdd} className="space-y-2 border-b border-white/10 p-3">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="عنوان کوتاه"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-accent-500/50"
              />
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="متن پاسخ"
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground placeholder:text-foreground/40 outline-none focus:border-accent-500/50"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-600"
              >
                ذخیره پاسخ آماده
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <p className="py-6 text-center text-xs text-foreground/50">در حال بارگذاری...</p>
            ) : responses.length === 0 ? (
              <p className="py-6 text-center text-xs text-foreground/50">هنوز پاسخ آماده‌ای ثبت نشده است.</p>
            ) : (
              responses.map((r) => (
                <div
                  key={r.id}
                  className="group flex items-start justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(r.body);
                      setOpen(false);
                    }}
                    className="min-w-0 flex-1 text-right"
                  >
                    <p className="text-xs font-semibold text-foreground">{r.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-foreground/50">{r.body}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    aria-label="حذف"
                    className="shrink-0 text-foreground/30 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
