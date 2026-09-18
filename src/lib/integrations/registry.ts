import { MessageSquareText, ShieldCheck, Mail, ShieldAlert, Bug } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  getCompanyInfo,
  getShahkarLite,
  getPersonInfo,
  getVehicleInfo,
  getWatterBillInfo,
  getSandboxEcho,
} from "@/lib/integrations/api-ir";
import { sendSms } from "@/lib/notifications/sms";
import { sendEmail } from "@/lib/notifications/email";

// Single source of truth for every external service this project talks to —
// the admin "یکپارچه‌سازی‌ها" hub (src/app/account/admin/integrations) is
// rendered entirely from this file, and the generic run route
// (src/app/api/admin/integrations/run/route.ts) executes services purely by
// looking them up here. Server-only module (imports Node-dependent client
// libs) — never import this from a "use client" file; pages pass plain,
// serializable data down to client components instead.
//
// The one thing this file exists to model correctly: a provider is NOT
// always "one API = one thing it does". api.ir is a single account/token
// backing dozens of unrelated web services (company lookup, ID verification,
// vehicle info, utility bills, ...) — Kavenegar, by contrast, does exactly
// one thing (send an SMS). `services` is an array precisely so both shapes
// fit the same structure without one of them being a special case.

export type IntegrationFieldSchema = {
  name: string;
  /** فارسی، برای label فرم */
  label: string;
  type: "text" | "textarea";
  placeholder?: string;
  required: boolean;
};

export type IntegrationRunResult =
  | { ok: true; data: unknown; message?: string | null }
  | { ok: false; error: string };

export type IntegrationService = {
  id: string;
  /** فارسی */
  displayName: string;
  /** فارسی، یک جمله */
  description: string;
  /** ساخته‌شده دقیقاً از روی requestBody همان endpoint در docs/api-ir-openapi.json (یا مستندات رسمی provider) — نه فرضی. */
  fields: IntegrationFieldSchema[];
  run: (input: Record<string, string>) => Promise<IntegrationRunResult>;
  /**
   * فارسی برای هر فیلد response (بر اساس schema واقعی endpoint، نه فرضی) —
   * IntegrationServiceForm این را برای نمایش خوانای نتیجه به‌جای JSON خام
   * استفاده می‌کند. کلیدها دقیقاً همان نام فیلد در response هستند (حتی برای
   * فیلدهای تودرتو، چون نام‌ها در یک سرویس تکراری نیستند). کلید ویژه‌ی
   * "$root" وقتی response.data خودش یک مقدار ساده است (نه object) — مثل
   * ShahkarLite که یک boolean خام برمی‌گرداند — برچسب آن مقدار را می‌دهد.
   * اختیاری: نبودش یعنی نمایش عمومی (کلید:مقدار خام) به‌جای این نگاشت.
   */
  resultLabels?: Record<string, string>;
};

export type IntegrationAuthType = "bearer" | "apikey" | "smtp-like";

export type IntegrationProvider = {
  id: "api-ir" | "kavenegar" | "resend" | "turnstile" | "sentry";
  displayName: string;
  description: string;
  icon: LucideIcon;
  baseUrl?: string;
  authType: IntegrationAuthType;
  /** چک خودکار وضعیت اتصال روی این‌ها انجام می‌شود — نه فقط ظاهر UI، در سرور. */
  envVarsRequired: string[];
  /** می‌تواند خالی باشد (مثلاً Sentry/Turnstile که «عملکرد قابل‌اجرا»ی مجزایی برای ادمین ندارند، فقط زیرساخت پسیو هستند). */
  services: IntegrationService[];
  /** رایگان، بدون هزینه‌ی واقعی — برای تأیید صرفاً درست‌کار‌کردن توکن/کلید، جدا از services. */
  testConnection?: () => Promise<IntegrationRunResult>;
};

function envelopeToResult(
  response: { success: boolean; message: string | null; data: unknown },
): IntegrationRunResult {
  if (!response.success) {
    return { ok: false, error: response.message || "درخواست ناموفق بود." };
  }
  return { ok: true, data: response.data, message: response.message };
}

/** Wraps a fire-and-forget side effect (send an SMS/email) as an IntegrationRunResult — for providers whose "service" is a void async call rather than a data-returning inquiry. */
async function runSideEffect(fn: () => Promise<void>, successMessage: string): Promise<IntegrationRunResult> {
  try {
    await fn();
    return { ok: true, data: null, message: successMessage };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "اجرا ناموفق بود." };
  }
}

export const INTEGRATIONS_REGISTRY: IntegrationProvider[] = [
  {
    id: "api-ir",
    displayName: "api.ir",
    description: "پلتفرم وب‌سرویس‌های استعلامی ایرانی — یک توکن، ده‌ها سرویس مستقل (استعلام شخص حقوقی، هویت، خودرو، قبوض و...).",
    icon: ShieldCheck,
    baseUrl: "https://s.api.ir",
    authType: "bearer",
    envVarsRequired: ["API_IR_TOKEN"],
    testConnection: async () => {
      const res = await getSandboxEcho("تست اتصال یکپارچه‌سازی");
      if (!res.success || !res.data) {
        return { ok: false, error: res.message || "اتصال ناموفق بود." };
      }
      if (!res.data.tokenStatus) {
        return { ok: false, error: "درخواست به api.ir رسید، اما توکن نامعتبر است." };
      }
      return { ok: true, data: res.data, message: "توکن معتبر است." };
    },
    services: [
      {
        id: "company-info",
        displayName: "استعلام شخص حقوقی",
        description: "دریافت اطلاعات ثبتی یک شرکت/موسسه از روی شناسه ملی ۱۱ رقمی.",
        fields: [{ name: "nationalID", label: "شناسه ملی شرکت", type: "text", placeholder: "14007650912", required: true }],
        run: async (input) => envelopeToResult(await getCompanyInfo(input.nationalID ?? "")),
        resultLabels: {
          companyType: "نوع شرکت",
          name: "نام رسمی",
          nationalID: "شناسه ملی",
          registerNumber: "شماره ثبت",
          registerDate: "تاریخ ثبت",
          active: "وضعیت فعالیت",
          address: "آدرس",
          postalCode: "کد پستی",
          province: "استان",
          city: "شهر",
          endDate: "تاریخ انحلال",
        },
      },
      {
        id: "shahkar-lite",
        displayName: "شاهکار Lite (تطبیق کد ملی و موبایل)",
        description: "بررسی اینکه یک شماره موبایل واقعاً متعلق به همان کد ملی است یا نه — نسخه‌ی ارزان‌تر شاهکار.",
        fields: [
          { name: "nationalCode", label: "کد ملی", type: "text", placeholder: "0010007700", required: true },
          { name: "mobile", label: "موبایل", type: "text", placeholder: "09120000000", required: true },
        ],
        run: async (input) => envelopeToResult(await getShahkarLite(input.nationalCode ?? "", input.mobile ?? "")),
        resultLabels: { $root: "تطابق کد ملی و موبایل" },
      },
      {
        id: "person-info",
        displayName: "استعلام مشخصات هویتی فرد",
        description: "دریافت نام، نام خانوادگی، نام پدر و وضعیت حیات از روی کد ملی و تاریخ تولد.",
        fields: [
          { name: "nationalCode", label: "کد ملی", type: "text", placeholder: "0010007700", required: true },
          { name: "birthDate", label: "تاریخ تولد (شمسی)", type: "text", placeholder: "1371/1/1", required: true },
        ],
        run: async (input) => envelopeToResult(await getPersonInfo(input.nationalCode ?? "", input.birthDate ?? "")),
        resultLabels: {
          nationalCode: "کد ملی",
          firstName: "نام",
          lastName: "نام خانوادگی",
          fatherName: "نام پدر",
          gender: "جنسیت",
          alive: "زنده است",
        },
      },
      {
        id: "vehicle-info",
        displayName: "استعلام مشخصات خودرو",
        description: "دریافت نام، شماره موتور/شاسی/VIN و مدل خودرو از روی کد ملی مالک و پلاک.",
        fields: [
          { name: "nationalCode", label: "کد ملی مالک", type: "text", placeholder: "0010007700", required: true },
          { name: "plateNumber", label: "شماره پلاک", type: "text", placeholder: "ایران 11 – 1111 ب 11", required: true },
        ],
        run: async (input) => envelopeToResult(await getVehicleInfo(input.nationalCode ?? "", input.plateNumber ?? "")),
        resultLabels: {
          name: "نام خودرو",
          engineNumber: "شماره موتور",
          chassisNumber: "شماره شاسی",
          vin: "VIN",
          model: "مدل",
        },
      },
      {
        id: "watter-bill-info",
        displayName: "استعلام قبض آب",
        description: "دریافت جزئیات قبض آب (مبلغ، مشترک، دوره مصرف) از روی شناسه قبض.",
        fields: [{ name: "billID", label: "شناسه قبض", type: "text", placeholder: "1100151403410", required: true }],
        run: async (input) => envelopeToResult(await getWatterBillInfo(input.billID ?? "")),
        resultLabels: {
          amount: "مبلغ قبض",
          billID: "شناسه قبض",
          payID: "شناسه پرداخت",
          date: "تاریخ",
          print: "", // نسخه‌ی HTML چاپی خام — چیزی برای نمایش درون‌خطی نیست، مخفی می‌شود
          info: "جزئیات اشتراک",
          ownerName: "نام مشترک",
          address: "آدرس",
          postalCode: "کد پستی",
          usageType: "نوع مصرف",
          meterNumber: "شماره کنتور",
          fileNumber: "شماره پرونده",
          city: "شهر",
          capacity: "ظرفیت",
          previousReadDate: "تاریخ قرائت قبلی",
          currentReadDate: "تاریخ قرائت فعلی",
          currentConsumption: "مصرف دوره جاری",
          previousNumber: "عدد کنتور قبلی",
          currentNumber: "عدد کنتور فعلی",
        },
      },
    ],
  },
  {
    id: "kavenegar",
    displayName: "Kavenegar",
    description: "ارسال پیامک — تنها یک عملکرد دارد، برخلاف api.ir که چند ده سرویس مستقل زیر یک حساب دارد.",
    icon: MessageSquareText,
    baseUrl: "https://api.kavenegar.com",
    authType: "apikey",
    envVarsRequired: ["KAVENEGAR_API_KEY"],
    services: [
      {
        id: "send-test-sms",
        displayName: "ارسال پیامک آزمایشی",
        description: "یک پیامک واقعی (با هزینه‌ی واقعی طبق تعرفه‌ی کاوه‌نگار) به شماره‌ی داده‌شده ارسال می‌کند.",
        fields: [
          { name: "to", label: "شماره موبایل گیرنده", type: "text", placeholder: "09120000000", required: true },
          { name: "message", label: "متن پیامک", type: "textarea", placeholder: "این یک پیامک آزمایشی است.", required: true },
        ],
        run: (input) => runSideEffect(() => sendSms({ to: input.to ?? "", message: input.message ?? "" }), "پیامک با موفقیت ارسال شد."),
      },
    ],
  },
  {
    id: "resend",
    displayName: "Resend",
    description: "ارسال ایمیل‌های تراکنشی سایت.",
    icon: Mail,
    baseUrl: "https://api.resend.com",
    authType: "apikey",
    envVarsRequired: ["RESEND_API_KEY"],
    services: [
      {
        id: "send-test-email",
        displayName: "ارسال ایمیل آزمایشی",
        description: "یک ایمیل واقعی به آدرس داده‌شده ارسال می‌کند (تا زمانی که دامنه در Resend تأیید نشده، فقط به ایمیل حساب خودتان قابل ارسال است).",
        fields: [
          { name: "to", label: "ایمیل گیرنده", type: "text", placeholder: "you@example.com", required: true },
          { name: "subject", label: "موضوع", type: "text", placeholder: "تست یکپارچه‌سازی", required: true },
          { name: "html", label: "متن پیام (HTML مجاز است)", type: "textarea", placeholder: "<p>این یک ایمیل آزمایشی است.</p>", required: true },
        ],
        run: (input) =>
          runSideEffect(
            () => sendEmail({ to: input.to ?? "", subject: input.subject ?? "", html: input.html ?? "" }),
            "ایمیل با موفقیت ارسال شد.",
          ),
      },
    ],
  },
  {
    id: "turnstile",
    displayName: "Cloudflare Turnstile",
    description: "تأیید ربات‌نبودن روی فرم‌های ورود/ثبت‌نام — فقط تأیید ورودی است، عملکرد قابل‌اجرای مجزایی برای ادمین ندارد.",
    icon: ShieldAlert,
    authType: "apikey",
    envVarsRequired: ["TURNSTILE_SECRET_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
    services: [],
  },
  {
    id: "sentry",
    displayName: "Sentry",
    description: "ثبت خودکار خطاهای سیستمی — سرویسی پسیو است که فقط داده دریافت می‌کند، عملکرد قابل‌اجرای مجزایی برای ادمین ندارد.",
    icon: Bug,
    authType: "apikey",
    envVarsRequired: ["SENTRY_DSN"],
    services: [],
  },
];

export function isProviderConnected(provider: IntegrationProvider): boolean {
  return provider.envVarsRequired.every((name) => !!process.env[name]?.trim());
}

export function getProvider(providerId: string): IntegrationProvider | undefined {
  return INTEGRATIONS_REGISTRY.find((p) => p.id === providerId);
}

export function getService(providerId: string, serviceId: string): IntegrationService | undefined {
  return getProvider(providerId)?.services.find((s) => s.id === serviceId);
}
