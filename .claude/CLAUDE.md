## قانون استفاده از Skill ها

قبل از شروع هر کار، بر اساس نوع کار، Skill مرتبط رو حتماً چک و استفاده کن:

- **بازطراحی، ممیزی، یا بهبود UI/UX** (چه یک کامپوننت چه یک صفحه‌ی کامل) → همیشه اول impeccable و web-design-guidelines رو چک کن، برای طراحی خلاقانه/غیرژنریک از frontend-design استفاده کن.
- **ساخت کامپوننت جدید رابط کاربری** (فرم، دراپ‌داون، مودال، دکمه) → از ui-styling استفاده کن (پروژه از Radix UI و Tailwind استفاده می‌کنه که این Skill پوشش می‌ده).
- **تصمیم درباره‌ی رنگ، فونت، پالت، یا اندازه** → از ui-ux-pro-max و design-system استفاده کن، به‌جای انتخاب دلبخواهی.
- **ساخت یا ویرایش نمودار/چارت** (مثل نمودارهای داشبورد ادمین) → از dataviz استفاده کن.
- **بعد از هر تغییر کد قابل‌توجه، قبل از این‌که بگی کارت تمومه** → از code-review برای بررسی کیفیت و simplify برای پاکسازی استفاده کن.
- **هر تغییری که به امنیت مربوطه** (احراز هویت، rate limiting، ورودی کاربر، پرداخت، API عمومی) → حتماً از security-review رد کن.
- **هر تست بصری/ریسپانسیو/رفتار واقعی UI** (چیزی که در این پروژه همیشه به آن تأکید شده) → به‌جای headless دستی، از chrome-devtools-mcp یا playwright برای گرفتن اسکرین‌شات و بررسی واقعی استفاده کن.
- **تولید فایل خروجی Word/Excel/PDF** (مثل قرارداد یا فاکتور) → از carbone-skill:carbone استفاده کن.
- **پیدا کردن سریع این‌که یک فیچر کجای کدبیس پیاده شده، یا فهم رابطه‌ی بین فایل‌ها** → از graphify استفاده کن به‌جای grep دستی طولانی.

این قانون نباید نادیده گرفته بشه؛ اگه Skill مرتبطی برای کاری هست و ازش استفاده نشه، نتیجه‌ی کار احتمالاً کیفیت پایین‌تری داره یا با استانداردهای پروژه ناهماهنگ می‌شه.

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
