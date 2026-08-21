# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, confirmed equally important — neither is secondary to the other:

1. **Public-site visitors** — B2B procurement/technical decision-makers at industrial companies evaluating or buying diesel generators, power engines, spare parts, and overhaul (اورهال) services. Sectors the site names as served: oil & gas / drilling, steel & manufacturing, construction & infrastructure, government, and small businesses.
2. **Account-panel users** (`/account/*`) — existing customers managing their own support tickets, contracts, and orders; and internal staff (ADMIN, SUPPORT) handling those same tickets/contracts/orders on the operational side, with ADMIN additionally managing blog and site content.

## Product Purpose

پویش راه صنعت یاشار (Yashar Industrial Route Development) supplies diesel generators, power engines, spare parts, and overhaul services — both new and used, sourced from established global brands — to industrial B2B buyers. Existing customers get a self-service account panel (tickets, contracts, orders, profile); staff get a matching internal panel to run support and fulfillment against the same data.

## Positioning

**Undecided — open decision, not yet answered by the user.** The current homepage states generic superlative claims (بهترین کیفیت / بهترین قیمت / سریع‌ترین تحویل — best quality / best price / fastest delivery) that any competitor could equally claim. A real, defensible differentiator (e.g. an authorized/exclusive brand representation, inventory breadth, technical/overhaul specialization, or something else) has not been established. Future design or copy work must not invent one — surface this as still-open rather than treating the current homepage language as the real positioning.

## Operating Context

- Public site: product/category browsing, blog, consultation request, pricing, FAQ — all Persian/RTL.
- Account panel: ticket support chat (polling-based, not real-time push), contract lifecycle (PDF upload/view, expiry warnings), order status tracking, profile management, 2FA.
- Admin/support panel (same app, role-gated): ticket handling, contract/order management (ADMIN full, SUPPORT read-only on contracts/orders), blog and site-content editing (ADMIN only), a shared media gallery, logs, and a stats dashboard.
- Dates are Jalali-first throughout (jalaali-js) with an optional Gregorian toggle on every date field — not a one-off, a standing UI pattern.

## Capabilities and Constraints

- Role-based access: ADMIN (full access), SUPPORT (full ticket access, read-only contracts/orders, no blog/site-content access), CUSTOMER (own data only — tickets/contracts/orders/profile, personal media gallery).
- Media gallery is ownership-separated: each CUSTOMER has a private gallery; ADMIN and SUPPORT share one gallery that excludes all customer files.
- 2FA (TOTP) available on accounts.
- Entire UI is Persian/RTL; no LTR/i18n variant exists or is planned.

## Brand Commitments

- Name: پویش راه صنعت یاشار (Yashar Industrial Route Development). Domain: yasharindustry.com.
- Visual identity already in code: dark, near-black background with a single orange accent (`#f97316`, brand-500), Vazirmatn typeface (Google Fonts, Arabic/Persian subset, `font-display: swap`).
- Company registration number ۴۷۶۰۶, operating since ۱۳۹۶ (9+ years as of the current homepage copy).

## Evidence on Hand

**Confirmed real:** company registration number (47606), founding year (1396 / 2017–18), the list of industry sectors the company states it serves (oil & gas/drilling, steel/manufacturing, construction/infrastructure, government, small business).

**Confirmed placeholder — do not treat as fact, do not extend:** the user confirmed the homepage's "۹۹٪ رضایت کارفرمایان" (99% client satisfaction) stat, "۱۲ مهندس متخصص" (12 specialist engineers) stat, and the three customer testimonials (سارا احمدی، علی رضایی، محمد کریمی) are placeholder content pending real data — not yet real. The `/contact` page's phone number also reads as a placeholder pattern (`+98 21 9100 0000`) and has not been confirmed real. Future work must not build further claims on top of these numbers/quotes, and should flag them for real-data replacement rather than treating them as settled brand proof.

## Product Principles

1. Public-site and account-panel are equally primary surfaces — a change that improves one at the operational or trust expense of the other is not a net improvement.
2. Every claim on the public site should be traceable to a real company fact (registration number, founding year, named sectors) until the placeholder stats/testimonials are replaced with real data — don't let generic superlatives stand in for the still-undecided real differentiator.
3. Role boundaries (ADMIN/SUPPORT/CUSTOMER, and the finer-grained read/write and gallery-ownership splits within them) are a real trust and security boundary, not a navigation filter — treat them as load-bearing in any redesign.
4. Persian/RTL with Jalali-first dates is the default reading context for every surface, not a localization layer bolted onto an LTR design.

## Accessibility & Inclusion

No specific standard or user need has been confirmed yet; not recorded as a requirement.
