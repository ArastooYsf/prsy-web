export type DownloadHostValidation = { ok: true; value: string } | { ok: false; error: string };

// Validates an admin-pasted link to a file they uploaded directly to the
// download host (bypassing the Next.js upload API, which has a body-size
// limit unsuitable for large catalogs/videos). Only an allow-listed domain
// is accepted for a full URL, so this can't be used to link to arbitrary
// external sites.
export function validateDownloadHostUrl(raw: string): DownloadHostValidation {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: "" };

  if (/^https?:\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return { ok: false, error: "آدرس وارد شده معتبر نیست." };
    }

    const allowed = (process.env.DOWNLOAD_HOST_ALLOWED_DOMAIN || "")
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    if (allowed.length === 0 || !allowed.includes(url.hostname.toLowerCase())) {
      return { ok: false, error: "دامنه‌ی وارد شده مجاز نیست." };
    }
    return { ok: true, value: trimmed };
  }

  if (trimmed.includes("..")) {
    return { ok: false, error: "مسیر وارد شده معتبر نیست." };
  }
  return { ok: true, value: trimmed };
}
