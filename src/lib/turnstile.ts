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
