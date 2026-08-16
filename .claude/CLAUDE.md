# graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

# QA خودکار برای این پروژه

از هر جلسه‌ی کار روی این پروژه به بعد — چه قبل از هرگونه تغییر، چه در انتهای هر تسک — موارد زیر را بررسی کن. یک Stop hook در `.claude/settings.json` این چک‌لیست را در پایان هر پاسخ یادآوری می‌کند؛ این فایل مرجع کامل همان چک‌لیست است.

## ۱. ریسپانسیو بودن (Mobile Responsiveness)
- سایزهای صفحه: موبایل (۳۷۵px)، تبلت (۷۶۸px)، دسکتاپ (۱۹۲۰px)
- المان‌هایی که overflow دارن یا اسکرول افقی ایجاد می‌کنن
- فونت‌سایز/پدینگ/مارجین در موبایل — نه خیلی کوچک، نه خیلی بزرگ
- تصاویری که در موبایل درست resize/crop نمی‌شن
- سایز دکمه‌ها و لینک‌های لمسی — حداقل ۴۴px
- اسلایدرها، کاروسل‌ها و کامپوننت‌های تعاملی در حالت لمسی

## ۲. تست Lighthouse
چهار امتیاز: Performance، Accessibility، Best Practices، SEO.

اگه دسترسی به Chrome/Lighthouse هست، از همین الگو استفاده کن (قبلاً در این پروژه تست شده):
```
CHROME_PATH=/snap/bin/chromium npx --yes lighthouse <url> \
  --chrome-flags='--headless=new --no-sandbox --disable-gpu' \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop --output=json --output-path=<path>.json
```
اگه اجرای مستقیم ممکن نبود، بر اساس معیارهای Core Web Vitals (LCP، INP، CLS) و موارد بخش ۳ دستی بررسی کن.

## ۳. مشکلات رایج که باید دنبالشون بگردی
- تصاویر بدون lazy loading یا فرمت بهینه‌نشده (WebP/AVIF)
- عدم وجود alt text روی تصاویر
- CSS/JS بدون minify یا render-blocking
- فونت‌های خارجی بدون `font-display: swap`
- عدم وجود meta viewport یا تنظیم اشتباه
- کنتراست رنگ ناکافی بین متن و پس‌زمینه
- المان‌های بدون aria-label برای دسترسی‌پذیری
- لینک‌ها/دکمه‌ها بدون focus state مشخص

## ۴. گزارش و رفع
- لیست کامل مشکلات با اولویت‌بندی: بحرانی / متوسط / جزئی
- برای هر مورد، فایل و خط دقیق کد
- فقط بعد از تأیید کاربر رفع کن؛ بعد از هر فیکس دوباره تست کن که مشکل جدیدی ایجاد نشده باشه

این چک به‌صورت مداوم در طول کار روی پروژه انجام می‌شه، نه فقط یک‌بار.
