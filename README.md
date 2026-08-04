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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
