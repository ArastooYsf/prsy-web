This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Project structure

Where a new file goes, by what it is:

- `src/app/` — routes only (`page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`). Don't colocate one-off components here — put them in `src/components/` under the folder below that matches who uses them, even if only one route imports it today.
- `src/components/ui/` — generic, reusable primitives with no knowledge of this site's features (buttons, inputs, badges, spinners, empty states). If a component imports site-specific data, hooks, or is only ever used from one feature area, it doesn't belong here. shadcn-generated primitives (e.g. `button.tsx`) keep their lowercase filename per shadcn convention; everything else in `components/` is PascalCase.
- `src/components/layout/` — site chrome: `Header.tsx`, `Footer.tsx`, and the header's own sub-pieces (cart menu, mega menu, mobile nav, search, theme toggle, scroll progress).
- `src/components/admin/` — super_admin/editor/sales-only components (forms, tables, dashboards).
- `src/components/account/` — customer-account-only components (profile, tickets, orders, contracts).
- `src/components/products/` — product catalog & PDP components.
- `src/components/` (root) — components genuinely shared across more than one of the areas above (e.g. `ConfirmDialog`, `TicketChat`, `MediaPickerModal`).
- `src/lib/` — framework-agnostic helpers, one concern per file, grouped into a subfolder only once a domain has enough files to need one (see `lib/documents/`, `lib/integrations/`, `lib/notifications/`); otherwise flat with a `<domain>-*.ts` filename prefix (e.g. `ticket-*.ts`, `log-*.ts`, `site-*.ts`) is fine and matches the existing convention here.
- `src/types/` — only for types shared across multiple unrelated files/domains. A type used by a single component stays colocated in that component's file — that's the default, not a gap to fill.
- `prisma/` — `schema.prisma` and `migrations/` (standard Prisma layout, don't move).

## Product media (images/videos)

All product images and videos are loaded through one environment variable,
`NEXT_PUBLIC_MEDIA_URL` (set in `.env.local`, template in `.env.example`).

Right now it points at the local `public/media` folder:

```
NEXT_PUBLIC_MEDIA_URL=/media
```

Components never hardcode a media URL — they call `getMediaUrl(path)` from
`src/lib/media.ts`, which joins `NEXT_PUBLIC_MEDIA_URL` with a relative path
(e.g. `getMediaUrl("products/diesel-generators.svg")`).

When a separate media/CDN host is ready, change `NEXT_PUBLIC_MEDIA_URL` to
that host's URL (e.g. `https://media.yasharindustry.com`) and redeploy — every
image and video on the site will load from the new host automatically, with
no code changes.

## Google Analytics (GA4)

Analytics is wired up but disabled by default. `NEXT_PUBLIC_GA_MEASUREMENT_ID`
in `.env.local` is empty, so no GA script ever loads and nothing errors.

To turn it on: create a GA4 property, grab its Measurement ID (looks like
`G-XXXXXXXXXX`), and set it in `.env.local`:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Redeploy — `src/app/layout.tsx` picks it up automatically and starts loading
`gtag.js` on every page. No other code changes needed.

## Sitemap & robots.txt

`src/app/sitemap.ts` and `src/app/robots.ts` use Next.js's built-in
conventions and are served at `/sitemap.xml` and `/robots.txt`. The sitemap
scans `src/app` for `page.tsx` files at build time, so adding a new page
(e.g. `src/app/new-route/page.tsx`) shows up in the sitemap automatically —
nothing to edit by hand.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
