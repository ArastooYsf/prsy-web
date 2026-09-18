"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Star, MessageCircle, X, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { formatJalali } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import MediaPickerModal from "@/components/MediaPickerModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { APPROVAL_STATUS } from "@/lib/status-labels";

export type ProductCommentImage = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
};

export type ProductCommentItem = {
  id: string;
  text: string;
  rating: number | null;
  createdAt: string;
  editedAt: string | null;
  authorId: string;
  authorName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  images: ProductCommentImage[];
};

// A file the viewer has picked but not sent yet — no DB id until the
// comment that carries it is created, so a locally-generated tempId is the
// React key (same pattern as TicketChat's PendingAttachment).
type PendingImage = { tempId: string; url: string; filename: string; mimeType: string; size: number };

const MAX_IMAGES = 6;

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

// Shared by the "new comment" form and the inline edit form — same fields,
// same image-picker wiring, just a different submit target/label.
function ImagePicker({ images, onChange }: { images: PendingImage[]; onChange: (next: PendingImage[]) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const removeOne = (tempId: string) => onChange(images.filter((img) => img.tempId !== tempId));

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground/80">تصویر (اختیاری)</label>
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.tempId} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-foreground/10">
              <Image src={getMediaUrl(img.url)} alt={img.filename} fill sizes="64px" className="object-cover" />
              <button
                type="button"
                onClick={() => removeOne(img.tempId)}
                aria-label="حذف تصویر"
                className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-foreground/10 px-3 text-xs font-semibold text-foreground/70 transition-colors hover:bg-foreground/10"
        >
          افزودن عکس
        </button>
      )}
      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        kind="image"
        scope="PRODUCT_COMMENT"
        multiple
        hint="حداکثر ۶ تصویر — هر تصویر تا ۸ مگابایت."
        onConfirm={(assets) => {
          const existingUrls = new Set(images.map((img) => img.url));
          const additions = assets
            .filter((a) => !existingUrls.has(a.url))
            .map((a) => ({ tempId: a.id, url: a.url, filename: a.filename, mimeType: a.mimeType, size: a.size }));
          onChange([...images, ...additions].slice(0, MAX_IMAGES));
        }}
      />
    </div>
  );
}

function CommentImages({ images }: { images: ProductCommentImage[] }) {
  if (images.length === 0) return null;
  return (
    <div className={cn("mt-3 flex flex-wrap gap-2", images.length === 1 ? "" : "")}>
      {images.map((img) => (
        <a
          key={img.id}
          href={getMediaUrl(img.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-foreground/10"
        >
          <Image src={getMediaUrl(img.url)} alt={img.filename} fill sizes="80px" className="object-cover" />
        </a>
      ))}
    </div>
  );
}

function NewCommentForm({ productId }: { productId: string }) {
  const { showToast } = useToast();
  const router = useRouter();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [images, setImages] = useState<PendingImage[]>([]);
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
      body: JSON.stringify({
        productId,
        text,
        rating: rating || null,
        images: images.map((img) => ({ url: img.url, filename: img.filename, mimeType: img.mimeType, size: img.size })),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ثبت دیدگاه.", "error");
      return;
    }

    setText("");
    setRating(0);
    setImages([]);
    setSubmitted(true);
    showToast("دیدگاه شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود.", "success");
    router.refresh();
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

      <ImagePicker images={images} onChange={setImages} />

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

function CommentStatusBadge({ status }: { status: ProductCommentItem["status"] }) {
  if (status === "APPROVED") return null;
  const info = APPROVAL_STATUS[status];
  if (!info) return null;
  return <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", info.className)}>{info.label}</span>;
}

function CommentListItem({
  comment,
  isMine,
  onUpdated,
  onDeleted,
}: {
  comment: ProductCommentItem;
  isMine: boolean;
  onUpdated: (updated: ProductCommentItem) => void;
  onDeleted: (id: string) => void;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [rating, setRating] = useState(comment.rating ?? 0);
  const [images, setImages] = useState<PendingImage[]>(
    comment.images.map((img) => ({ tempId: img.id, url: img.url, filename: img.filename, mimeType: img.mimeType, size: 0 })),
  );
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEdit = () => {
    setText(comment.text);
    setRating(comment.rating ?? 0);
    setImages(
      comment.images.map((img) => ({ tempId: img.id, url: img.url, filename: img.filename, mimeType: img.mimeType, size: 0 })),
    );
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!text.trim()) {
      showToast("متن دیدگاه نمی‌تواند خالی باشد.", "error");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/account/product-comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        rating: rating || null,
        images: images.map((img) => ({ url: img.url, filename: img.filename, mimeType: img.mimeType, size: img.size })),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      showToast(body?.error || "خطا در ذخیره ویرایش.", "error");
      return;
    }

    const { comment: updated } = await res.json();
    onUpdated({
      ...comment,
      text: updated.text,
      rating: updated.rating,
      status: updated.status,
      editedAt: updated.editedAt,
      images: updated.images,
    });
    setEditing(false);
    showToast("دیدگاه ویرایش شد و دوباره در انتظار تأیید مدیر قرار گرفت.", "success");
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/account/product-comments/${comment.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteOpen(false);

    if (!res.ok) {
      showToast("خطا در حذف دیدگاه.", "error");
      return;
    }

    onDeleted(comment.id);
    showToast("دیدگاه حذف شد.", "success");
  };

  if (editing) {
    return (
      <li className="space-y-4 rounded-2xl border border-accent-500/30 bg-foreground/[0.03] p-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">امتیاز</label>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={2000} className={inputClass} />
        <ImagePicker images={images} onChange={setImages} />
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground/60 hover:text-foreground"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={saveEdit}
            disabled={saving}
            className="rounded-full bg-accent-500 px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent-600 disabled:opacity-60"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-foreground/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
          <CommentStatusBadge status={comment.status} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground/40">{formatJalali(comment.createdAt)}</span>
          {isMine && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startEdit}
                aria-label="ویرایش دیدگاه"
                className="flex size-7 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                aria-label="حذف دیدگاه"
                className="flex size-7 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      {comment.rating != null && (
        <div className="mt-2">
          <StarRatingDisplay rating={comment.rating} />
        </div>
      )}
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-foreground/75">{comment.text}</p>
      <CommentImages images={comment.images} />
      {comment.editedAt && <p className="mt-2 text-[11px] text-foreground/35">ویرایش شده</p>}

      <ConfirmDialog
        open={deleteOpen}
        title="حذف دیدگاه"
        message="مطمئنید می‌خواهید این دیدگاه را حذف کنید؟"
        confirmLabel="حذف کن"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </li>
  );
}

export default function ProductComments({
  productId,
  comments: initialComments,
  isLoggedIn,
  viewerId,
}: {
  productId: string;
  comments: ProductCommentItem[];
  isLoggedIn: boolean;
  viewerId: string | null;
}) {
  const pathname = usePathname();
  const [comments, setComments] = useState(initialComments);

  const handleUpdated = (updated: ProductCommentItem) => {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };
  const handleDeleted = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

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
            <CommentListItem
              key={comment.id}
              comment={comment}
              isMine={!!viewerId && comment.authorId === viewerId}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
