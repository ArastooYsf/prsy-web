"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, MessageCircle } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { formatJalali } from "@/lib/jalali";
import { cn } from "@/lib/utils";

export type ProductCommentItem = {
  id: string;
  text: string;
  rating: number | null;
  createdAt: string;
  authorName: string;
};

const inputClass =
  "w-full rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

function StarRatingInput({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          onMouseEnter={() => setHovered(n)}
          aria-label={`امتیاز ${n} از ۵`}
          className="flex size-8 items-center justify-center text-amber-400"
        >
          <Star className="size-5" fill={(hovered || value) >= n ? "currentColor" : "none"} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400" aria-label={`امتیاز ${rating} از ۵`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className="size-3.5" fill={rating >= n ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </div>
  );
}

function NewCommentForm({ productId }: { productId: string }) {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      showToast("متن دیدگاه الزامی است.", "error");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/account/product-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, text, rating: rating || null }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ثبت دیدگاه.", "error");
      return;
    }

    setText("");
    setRating(0);
    setSubmitted(true);
    showToast("دیدگاه شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود.", "success");
  };

  if (submitted) {
    return (
      <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-sm text-emerald-400">
        دیدگاه شما ثبت شد و پس از بررسی و تأیید مدیر سایت نمایش داده خواهد شد.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">امتیاز شما (اختیاری)</label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground/80">دیدگاه شما</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={2000}
          className={inputClass}
          placeholder="نظر خود را درباره‌ی این محصول بنویسید..."
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent-500 px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "در حال ثبت..." : "ثبت دیدگاه"}
      </button>
    </form>
  );
}

export default function ProductComments({
  productId,
  comments,
  isLoggedIn,
}: {
  productId: string;
  comments: ProductCommentItem[];
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {isLoggedIn ? (
        <NewCommentForm productId={productId} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5">
          <p className="text-sm text-foreground/60">برای ثبت دیدگاه ابتدا وارد حساب کاربری خود شوید.</p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
            className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-600"
          >
            ورود به حساب
          </Link>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="flex items-center gap-2 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 text-sm text-foreground/50">
          <MessageCircle className="size-4 shrink-0" />
          هنوز دیدگاهی برای این محصول ثبت نشده است.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className={cn("rounded-2xl border border-foreground/10 p-5")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
                <span className="text-xs text-foreground/40">{formatJalali(comment.createdAt)}</span>
              </div>
              {comment.rating != null && (
                <div className="mt-2">
                  <StarRatingDisplay rating={comment.rating} />
                </div>
              )}
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/75">{comment.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
