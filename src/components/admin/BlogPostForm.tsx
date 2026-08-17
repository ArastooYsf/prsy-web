"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaPicker from "@/components/admin/MediaPicker";
import GregorianDatePicker from "@/components/admin/GregorianDatePicker";
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
    <form onSubmit={handleSubmit} className="flex h-dvh flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <Link
          href="/account/admin/blog"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-white/20 hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          بازگشت به لیست وبلاگ
        </Link>
        <h1 className="text-sm font-semibold text-foreground/60">{mode === "create" ? "پست جدید" : "ویرایش پست"}</h1>

        <div className="mr-auto flex items-center gap-3">
          {error && <p className="text-xs font-medium text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center rounded-full bg-accent-500 px-6 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Writing panel — right side in RTL (first in DOM), full-height + independently scrollable at lg+ */}
        <div className="border-b border-white/10 p-4 sm:p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:border-b-0 lg:border-l">
          <div className="mx-auto max-w-2xl space-y-5">
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

            <MediaPicker
              label="تصویر شاخص"
              multiple={false}
              value={coverImage ? [coverImage] : []}
              onChange={(paths) => setCoverImage(paths[0] ?? "")}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">متن پست</label>
              <RichTextEditor value={content} onChange={setContent} />
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
                  <div className="w-44">
                    <GregorianDatePicker value={publishedAt} onChange={setPublishedAt} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview panel — left side in RTL, full-height + independently scrollable at lg+ */}
        <div className="bg-white/[0.02] p-4 sm:p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div className="mx-auto max-w-2xl">
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
                __html:
                  content && content !== "<p></p>"
                    ? content
                    : '<p class="text-foreground/40">متن پست همین‌جا نمایش داده می‌شود...</p>',
              }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
