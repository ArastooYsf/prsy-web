import {
  InstagramLogo,
  TelegramLogo,
  WhatsappLogo,
  LinkedinLogo,
  XLogo,
  YoutubeLogo,
  FacebookLogo,
  GithubLogo,
  TiktokLogo,
  PinterestLogo,
  ThreadsLogo,
  DiscordLogo,
  PlayCircle,
  ChatCircleDots,
  Globe,
} from "@phosphor-icons/react/ssr";
// Type-only (erased at compile time) — same reasoning as site-content-defaults.ts.
import type { Icon } from "@phosphor-icons/react";

// Central domain → icon dictionary for the footer/contact social links. The
// admin only pastes a URL; the platform (name + icon) is detected from its
// hostname, so supporting a new network is one more entry here — nothing
// else reads a hardcoded list. `domains` match the host itself or any
// subdomain of it (m.instagram.com, web.telegram.org, ...). Kept in a plain
// module (no "use client") so server components and the client Footer share it.
export type SocialPlatform = { id: string; name: string; domains: readonly string[]; Icon: Icon };

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  { id: "instagram", name: "اینستاگرام", domains: ["instagram.com", "instagr.am"], Icon: InstagramLogo },
  { id: "telegram", name: "تلگرام", domains: ["t.me", "telegram.me", "telegram.org", "telegram.dog"], Icon: TelegramLogo },
  { id: "whatsapp", name: "واتساپ", domains: ["wa.me", "whatsapp.com"], Icon: WhatsappLogo },
  { id: "linkedin", name: "لینکدین", domains: ["linkedin.com", "lnkd.in"], Icon: LinkedinLogo },
  { id: "x", name: "ایکس (توییتر)", domains: ["x.com", "twitter.com"], Icon: XLogo },
  { id: "youtube", name: "یوتیوب", domains: ["youtube.com", "youtu.be"], Icon: YoutubeLogo },
  { id: "facebook", name: "فیسبوک", domains: ["facebook.com", "fb.com", "fb.me"], Icon: FacebookLogo },
  { id: "github", name: "گیت‌هاب", domains: ["github.com"], Icon: GithubLogo },
  { id: "tiktok", name: "تیک‌تاک", domains: ["tiktok.com"], Icon: TiktokLogo },
  { id: "pinterest", name: "پینترست", domains: ["pinterest.com", "pin.it"], Icon: PinterestLogo },
  { id: "threads", name: "تردز", domains: ["threads.net", "threads.com"], Icon: ThreadsLogo },
  { id: "discord", name: "دیسکورد", domains: ["discord.com", "discord.gg"], Icon: DiscordLogo },
  // Iranian networks have no Phosphor brand glyph — a generic video/chat icon
  // stands in, still labelled with the real network name.
  { id: "aparat", name: "آپارات", domains: ["aparat.com"], Icon: PlayCircle },
  { id: "eitaa", name: "ایتا", domains: ["eitaa.com"], Icon: ChatCircleDots },
  { id: "rubika", name: "روبیکا", domains: ["rubika.ir"], Icon: ChatCircleDots },
  { id: "bale", name: "بله", domains: ["bale.ai", "ble.ir"], Icon: ChatCircleDots },
];

export const FALLBACK_SOCIAL_ICON: Icon = Globe;

/**
 * Turns whatever the admin typed ("instagram.com/acme", "https://t.me/x")
 * into a safe absolute http(s) URL, or "" if it isn't one. A missing scheme
 * is added; credentials-in-URL and non-http(s) schemes (javascript:, mailto:
 * that only parse once a scheme is prepended) are rejected.
 */
export function normalizeSocialUrl(input: string): string {
  const text = input.trim();
  if (!text || /\s/.test(text)) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (url.username || url.password || !url.hostname.includes(".")) return "";
    return withScheme;
  } catch {
    return "";
  }
}

/** Detected platform for a URL — an unknown domain gets the generic globe icon, labelled with its hostname. */
export function getSocialLink(url: string): { name: string; Icon: Icon; known: boolean } {
  let host = "";
  try {
    host = new URL(normalizeSocialUrl(url)).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    // no valid host — falls through to the fallback below
  }
  const platform = SOCIAL_PLATFORMS.find((p) => p.domains.some((d) => host === d || host.endsWith(`.${d}`)));
  if (platform) return { name: platform.name, Icon: platform.Icon, known: true };
  return { name: host || "لینک", Icon: FALLBACK_SOCIAL_ICON, known: false };
}
