"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPicker from "@/components/admin/MediaPicker";
import { slugify } from "@/lib/slugify";
import { getMediaUrl } from "@/lib/media";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 outline-none transition-colors focus:border-accent-500/50";

type BlogPostFormProps = {
  mode: "create" | "edit";
  post?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    published: boolean;
    publishedAt: string | null;
  };
};

export default function BlogPostForm({ mode, post }: BlogPostFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [publishedAt, setPublishedAt] = useState(
    post?.publishedAt ? post.publishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim() || content === "<p></p>") {
      setError("عنوان و متن پست الزامی هستند.");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      published,
      publishedAt: published ? publishedAt : null,
    };

    const res = await fetch(mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${post!.id}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error || "خطا در ذخیره پست.");
      return;
    }

    router.push("/account/admin/blog");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="pb-[26rem] sm:pb-80">
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">عنوان</label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className={inputClass}
            placeholder="عنوان پست"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">نامک (slug)</label>
          <input
            dir="ltr"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={inputClass}
            placeholder="post-slug"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground/80">خلاصه</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="یک یا دو جمله معرفی کوتاه پست"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 accent-accent-500"
            />
            منتشر شود
          </label>

          {published && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-foreground/80">تاریخ انتشار</label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent-500/50"
              />
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-foreground/40">پیش‌نمایش زنده</p>
        <h1 className="text-balance text-2xl font-black leading-tight sm:text-3xl">{title || "عنوان پست"}</h1>
        {coverImage && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <img src={getMediaUrl(coverImage)} alt="" className="w-full object-cover" />
          </div>
        )}
        <div
          className="prose prose-invert prose-sm mt-6 max-w-none leading-8 sm:prose-base [&_a]:text-accent-400"
          dangerouslySetInnerHTML={{
            __html: content && content !== "<p></p>" ? content : '<p class="text-foreground/40">متن پست همین‌جا نمایش داده می‌شود...</p>',
          }}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
        <div className="container flex flex-col gap-4 py-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن پست</label>
            <div className="max-h-[220px] overflow-y-auto rounded-lg">
              <RichTextEditor value={content} onChange={setContent} />
            </div>
          </div>

          <div className="w-full shrink-0 sm:w-52">
            <MediaPicker
              label="تصویر شاخص"
              multiple={false}
              value={coverImage ? [coverImage] : []}
              onChange={(paths) => setCoverImage(paths[0] ?? "")}
            />
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => router.push("/account/admin/blog")}
              className="rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-foreground/70 transition-colors hover:border-white/20"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-accent-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
