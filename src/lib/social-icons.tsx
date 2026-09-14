import { InstagramLogo, LinkedinLogo, TelegramLogo } from "@phosphor-icons/react/ssr";

// Shared between Footer.tsx ("use client") and server components (the
// /contact page) — kept in its own plain module (no "use client") so a
// server component can import it directly without crossing a client
// boundary just to read a few static brand icons.
export const SOCIAL_ICONS = {
  instagramUrl: {
    name: "اینستاگرام",
    icon: <InstagramLogo size={18} />,
  },
  linkedinUrl: {
    name: "لینکدین",
    icon: <LinkedinLogo size={18} />,
  },
  telegramUrl: {
    name: "تلگرام",
    icon: <TelegramLogo size={18} />,
  },
} as const;
