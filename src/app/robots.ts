import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Auth-gated and utility routes already carry a page-level `noindex`
      // (see e.g. src/app/account/layout.tsx), which stops indexing but not
      // crawling — disallowing them here saves crawl budget instead of
      // letting Googlebot spend it on pages that only redirect to /login.
      disallow: ["/account/", "/api/", "/login", "/register", "/cart", "/documents/", "/forbidden", "/maintenance"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
