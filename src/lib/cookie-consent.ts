// Shared between CookieConsentBanner (writer) and AnalyticsScripts (reader)
// so the two never drift on the storage key or event name.
export const COOKIE_CONSENT_KEY = "yashar_cookie_consent";
export const COOKIE_CONSENT_EVENT = "yashar:cookieConsentAccepted";

export function hasCookieConsent(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}
