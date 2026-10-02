// URL formats verified against real sources, not guessed:
// - Google: documented universal cross-platform directions URL.
// - Neshan: nshn.ir destination= (lat,lng) per Neshan's own map-launcher
//   integration (github.com/mattermoran/map_launcher, lib/src/maps/neshan.dart),
//   which is also the source for the iOS custom scheme below and the
//   Android package id (org.rajman.neshan.traffic.tehran.navigator).
// - Balad: balad.ir/directions/driving?destination= (lng,lat — confirmed by
//   matching a real city's known coordinates against Balad's own indexed
//   URL). Android package id (com.baladmaps) confirmed against its real
//   Google Play listing. No confirmed public iOS app — Balad is an Iranian
//   service and Apple does not operate an App Store storefront for Iran, so
//   iOS/desktop always gets the web link for it, same as "app not installed".

const NESHAN_ANDROID_PACKAGE = "org.rajman.neshan.traffic.tehran.navigator";
const BALAD_ANDROID_PACKAGE = "com.baladmaps";

export type MapLinks = {
  google: string;
  neshan: string | null;
  balad: string | null;
};

export function buildMapLinks({
  lat,
  lng,
  address,
}: {
  lat: number | null;
  lng: number | null;
  address: string | null;
}): MapLinks {
  if (lat == null || lng == null) {
    return {
      google: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "",
      neshan: null,
      balad: null,
    };
  }

  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    neshan: `https://nshn.ir/?destination=${lat},${lng}`,
    balad: `https://balad.ir/directions/driving?destination=${lng},${lat}`,
  };
}

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

// Chrome-on-Android's documented mechanism for "try this app, fall back to
// a URL if it's not installed" (developer.chrome.com/docs/android/intents) —
// without an explicit browser_fallback_url, a missing app falls back to the
// Play Store instead of the actual destination, which is the exact
// "opens the app store instead of the web page" failure being fixed here.
function buildAndroidIntentUrl(httpsUrl: string, packageName: string): string {
  const withoutScheme = httpsUrl.replace(/^https?:\/\//, "");
  return `intent://${withoutScheme}#Intent;scheme=https;package=${packageName};S.browser_fallback_url=${encodeURIComponent(httpsUrl)};end`;
}

// A custom URL scheme only ever navigates if some app has registered it —
// there's no synchronous "is this installed" check, so the standard pattern
// is: attempt it, then check back after a beat. If the tab is still visible
// (no app intercepted), assume there's no app and fall back to the web URL.
function openWithSchemeFallback(scheme: string, fallbackUrl: string): void {
  const start = Date.now();
  window.location.href = scheme;
  setTimeout(() => {
    if (document.visibilityState === "visible" && Date.now() - start < 3000) {
      window.location.href = fallbackUrl;
    }
  }, 1500);
}

// Opens a map app's routing link through whichever mechanism actually loads
// the destination inside that app, with a real fallback (never the Play
// Store, never a dead link) when the app isn't there. Always same-tab
// navigation — a target="_blank" tab that gets handed off to a native app
// before it ever renders anything is left behind permanently blank on iOS,
// which is what broke the browser back button; same-tab navigation lets an
// app hand-off simply background the one tab untouched, and lets a genuine
// web fallback use ordinary browser history.
export function openMapLink(kind: "google" | "neshan" | "balad", lat: number | null, lng: number | null, links: MapLinks): void {
  const platform = detectPlatform();

  if (kind === "google") {
    window.location.href = links.google;
    return;
  }

  if (kind === "neshan" && links.neshan) {
    if (platform === "android") {
      window.location.href = buildAndroidIntentUrl(links.neshan, NESHAN_ANDROID_PACKAGE);
    } else if (platform === "ios" && lat != null && lng != null) {
      openWithSchemeFallback(`neshan://?destination=${lat},${lng}`, links.neshan);
    } else {
      window.location.href = links.neshan;
    }
    return;
  }

  if (kind === "balad" && links.balad) {
    if (platform === "android") {
      window.location.href = buildAndroidIntentUrl(links.balad, BALAD_ANDROID_PACKAGE);
    } else {
      window.location.href = links.balad;
    }
  }
}
