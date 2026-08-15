// Email clients don't load Tailwind (or external CSS reliably), so every
// style here is inline. Colors are hardcoded to the site's accent orange
// (#f97316, see tailwind.config.ts `accent.500`) rather than referencing
// theme tokens that only exist in the app's own build.
const ACCENT = "#f97316";
const ACCENT_DARK = "#ea580c";
const BG = "#0b0b0f";
const CARD_BG = "#15151c";
const TEXT = "#e7e7ea";
const MUTED = "#9a9aa5";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailLayout({ title, bodyHtml }: { title: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG};font-family:Tahoma,Arial,sans-serif;color:${TEXT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${CARD_BG};border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <tr>
              <td style="padding:28px 32px 20px;text-align:right;" dir="rtl">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK});text-align:center;vertical-align:middle;font-weight:bold;color:#fff;font-size:14px;">
                      یا
                    </td>
                    <td style="padding-right:10px;font-weight:bold;font-size:15px;color:${TEXT};">پویش راه صنعت یاشار</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 32px 32px;text-align:right;font-size:14px;line-height:1.9;" dir="rtl">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:right;font-size:12px;color:${MUTED};line-height:1.8;" dir="rtl">
                پویش راه صنعت یاشار — تهران، خیابان ولیعصر، برج صنعت، طبقه ۵<br />
                تلفن: ۰۲۱-۹۱۰۰۰۰۰۰ &nbsp;|&nbsp; ایمیل: info@yasharindustry.com
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;">
    <tr>
      <td style="border-radius:10px;background:${ACCENT};">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:11px 22px;color:#fff;text-decoration:none;font-size:13px;font-weight:bold;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function ticketReplyEmail({ subject, summary, link }: { subject: string; summary: string; link: string }): string {
  return emailLayout({
    title: `پاسخ جدید برای تیکت «${subject}»`,
    bodyHtml: `
      <p style="margin:0 0 8px;color:${TEXT};font-weight:bold;">پاسخ جدیدی برای تیکت شما ثبت شد</p>
      <p style="margin:0 0 4px;color:${MUTED};">موضوع تیکت: <span style="color:${TEXT};">${escapeHtml(subject)}</span></p>
      <p style="margin:12px 0 0;padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:10px;color:${TEXT};">${escapeHtml(summary)}</p>
      ${ctaButton("مشاهده تیکت", link)}
    `,
  });
}

export function staffNewMessageEmail({ subject, customerName, link }: { subject: string; customerName: string; link: string }): string {
  return emailLayout({
    title: `پیام جدید در تیکت «${subject}»`,
    bodyHtml: `
      <p style="margin:0 0 8px;color:${TEXT};font-weight:bold;">پیام جدیدی از مشتری ثبت شد</p>
      <p style="margin:0 0 4px;color:${MUTED};">مشتری: <span style="color:${TEXT};">${escapeHtml(customerName)}</span></p>
      <p style="margin:0 0 4px;color:${MUTED};">موضوع تیکت: <span style="color:${TEXT};">${escapeHtml(subject)}</span></p>
      ${ctaButton("مشاهده و پاسخ", link)}
    `,
  });
}

export function orderStatusEmail({
  orderNumber,
  statusLabel,
  link,
}: {
  orderNumber: string;
  statusLabel: string;
  link: string;
}): string {
  return emailLayout({
    title: `وضعیت سفارش «${orderNumber}»`,
    bodyHtml: `
      <p style="margin:0 0 8px;color:${TEXT};font-weight:bold;">وضعیت سفارش شما به‌روزرسانی شد</p>
      <p style="margin:0 0 4px;color:${MUTED};">شماره سفارش: <span style="color:${TEXT};">${escapeHtml(orderNumber)}</span></p>
      <p style="margin:12px 0 0;padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:10px;color:${TEXT};">وضعیت جدید: <strong style="color:${ACCENT};">${escapeHtml(statusLabel)}</strong></p>
      ${ctaButton("مشاهده جزئیات سفارش", link)}
    `,
  });
}

export function contractExpiryEmail({
  title,
  endDateLabel,
  link,
}: {
  title: string;
  endDateLabel: string;
  link: string;
}): string {
  return emailLayout({
    title: `یادآوری انقضای قرارداد «${title}»`,
    bodyHtml: `
      <p style="margin:0 0 8px;color:${TEXT};font-weight:bold;">قرارداد شما رو به پایان است</p>
      <p style="margin:0 0 4px;color:${MUTED};">عنوان قرارداد: <span style="color:${TEXT};">${escapeHtml(title)}</span></p>
      <p style="margin:12px 0 0;padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:10px;color:${TEXT};">تاریخ پایان: <strong style="color:${ACCENT};">${escapeHtml(endDateLabel)}</strong></p>
      ${ctaButton("مشاهده قرارداد", link)}
    `,
  });
}
