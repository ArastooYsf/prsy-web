import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        // The 50-900 steps are CSS-variable-driven (not static hex) so a
        // scoped override (see .theme-white-blue in globals.css) can swap
        // the whole brand-signal scale from orange to blue for a single
        // route without touching every component that reaches for
        // `accent-400`/`bg-accent-500`/etc. Values at :root match the
        // original static hex exactly, so nothing changes anywhere unless
        // that scope class is applied.
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
          50: "rgb(var(--accent-50) / <alpha-value>)",
          100: "rgb(var(--accent-100) / <alpha-value>)",
          200: "rgb(var(--accent-200) / <alpha-value>)",
          300: "rgb(var(--accent-300) / <alpha-value>)",
          400: "rgb(var(--accent-400) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
          600: "rgb(var(--accent-600) / <alpha-value>)",
          700: "rgb(var(--accent-700) / <alpha-value>)",
          800: "rgb(var(--accent-800) / <alpha-value>)",
          900: "rgb(var(--accent-900) / <alpha-value>)",
        },

        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
      },
      fontFamily: {
        // Shabnam FD first (self-hosted, see globals.css's @font-face block
        // + public/fonts/shabnam-fd), Vazirmatn second as the font-display:
        // swap fallback — it's already self-hosted via next/font/google
        // (see layout.tsx), so the fallback paint is another real Persian
        // face with a similar x-height, not the browser's generic sans.
        sans: ["Shabnam FD", "var(--font-vazirmatn)", "sans-serif"],
      },
      // Shabnam FD is a static font family (300/400/500/700 only) — unlike
      // Vazirmatn, the variable font it replaces as the primary face, it has
      // no real 600 weight. Left at Tailwind's default, `font-semibold`
      // (used ~130 places across the site) would fall back to the browser's
      // own nearest-weight matching, which lands on 700 anyway for a
      // requested weight above 500 — aliasing it here just makes that
      // explicit instead of relying on implicit fallback behavior.
      fontWeight: {
        semibold: "700",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
        // Same grid texture, dark lines for light backgrounds — a
        // background-image value can't pick up a CSS-variable override the
        // way a color utility can, so this needs its own explicit variant
        // rather than swapping via .theme-white-blue.
        "grid-pattern-dark":
          "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
