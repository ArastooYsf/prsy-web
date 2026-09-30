const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string | null | undefined, remoteIp?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Matches this project's convention for optional integrations (Resend,
    // Kavenegar, api.ir): missing config degrades gracefully instead of
    // hard-failing. Without this, forgetting to set TURNSTILE_SECRET_KEY (or
    // NEXT_PUBLIC_TURNSTILE_SITE_KEY, see TurnstileWidget.tsx) in production
    // would permanently lock every login out — even with correct credentials
    // — since verification would always fail. The login IP rate limiter
    // right below this call stays active regardless, so brute-force
    // protection isn't fully lost when CAPTCHA is unconfigured.
    console.warn("[turnstile] TURNSTILE_SECRET_KEY is not set — skipping CAPTCHA verification.");
    return true;
  }

  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Turnstile has no free "echo"/ping endpoint — it's a client-side widget, and
 * verification only ever happens against a real user-solved token. The
 * equivalent free check: send siteverify a deliberately-fake response token
 * anyway. Cloudflare validates the *secret key* before it even looks at the
 * token, so the specific error code it replies with tells us whether the
 * secret itself is valid, without needing a real widget solve. Any outcome
 * other than "the secret was rejected" (success, or the fake token being
 * rejected as invalid/missing/already-used) means the secret is good and
 * Cloudflare was actually reached.
 */
export async function checkTurnstileConnection(): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!secret || !siteKey) {
    return { ok: false, error: "TURNSTILE_SECRET_KEY یا NEXT_PUBLIC_TURNSTILE_SITE_KEY تنظیم نشده است." };
  }
  if (secret.trim().length < 10 || siteKey.trim().length < 10) {
    return { ok: false, error: "فرمت کلید Turnstile معتبر به نظر نمی‌رسد (خیلی کوتاه است)." };
  }

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: "test-connection-check" }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json().catch(() => null)) as { success?: boolean; "error-codes"?: string[] } | null;
    const errorCodes = data?.["error-codes"] ?? [];

    if (errorCodes.includes("invalid-input-secret") || errorCodes.includes("missing-input-secret")) {
      return { ok: false, error: "کلید Secret نامعتبر است." };
    }
    return { ok: true, message: "اتصال به Cloudflare Turnstile برقرار است و کلید Secret معتبر است." };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "اتصال به Cloudflare Turnstile برقرار نشد." };
  }
}
