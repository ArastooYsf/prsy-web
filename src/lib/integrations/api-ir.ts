// Thin, faithful client for api.ir's web services — built from api.ir's own
// OpenAPI 3.1.1 spec (docs/api-ir-openapi.json in this repo; api.ir's public
// marketing pages don't expose this contract, only the logged-in developer
// panel at p.api.ir does — see that file's sibling .md for provenance).
//
// Base URL: https://s.api.ir/ (override with API_IR_BASE_URL for testing
// against a local mock — see the module tests, never used in production).
// Auth: `Authorization: Bearer <API_IR_TOKEN>` on every call — api.ir issues
// the key itself as the bearer token, no separate OAuth exchange.
//
// Six endpoints are wired up (api.ir has dozens more in the spec — only the
// ones relevant to an industrial B2B seller are here; see
// src/lib/integrations/registry.ts for how these are exposed to admins):
//   POST /api/sw1/CompanyInfo    — استعلام شخص حقوقی (legal-entity lookup)
//   POST /api/sw1/ShahkarLite    — تطبیق کد ملی با موبایل (cheaper Shahkar variant)
//   POST /api/sw1/PersonInfo     — استعلام مشخصات هویتی فرد
//   POST /api/sw1/VehicleInfo    — استعلام مشخصات خودرو
//   POST /api/sw1/WatterBillInfo — استعلام قبض آب (endpoint name is api.ir's
//                                  own spelling, not a typo introduced here)
//   POST /api/Sandbox/Echo       — free connectivity/token check (tokenStatus
//                                  in the response tells you if the bearer
//                                  token itself is valid, with zero real cost)
//
// All endpoints share one response envelope shape, reproduced here exactly
// as api.ir documents it — callers get this shape back verbatim, including
// for a request that never reached api.ir at all (missing token, timeout,
// network error): those cases are synthesized into the same envelope
// instead of throwing, so a caller only ever has one shape to branch on.

const API_IR_BASE_URL = process.env.API_IR_BASE_URL || "https://s.api.ir";
const COMPANY_INFO_PATH = "/api/sw1/CompanyInfo";
const SANDBOX_ECHO_PATH = "/api/Sandbox/Echo";
const REQUEST_TIMEOUT_MS = 10_000;

// Iran's شناسه ملی اشخاص حقوقی (legal-entity national ID) is exactly 11
// digits. Checked before spending a paid api.ir call on input that can't
// possibly be valid — api.ir's own response is still the authority on
// whether a well-formed ID actually exists/is active.
const NATIONAL_ID_PATTERN = /^\d{11}$/;

export function isValidNationalIdFormat(nationalId: string): boolean {
  return NATIONAL_ID_PATTERN.test(nationalId.trim());
}

/** The one envelope shape every api.ir endpoint (and callApiIr's synthesized failures) returns. */
export type ApiIrResult<T> = { success: boolean; code: number; message: string | null; data: T | null };

// ---- CompanyInfo (استعلام شخص حقوقی) ----

/** Exactly api.ir's `CompanyInfoRes` schema — property names/types as documented, not renamed. */
export interface CompanyInfoData {
  /** نوع شرکت، مثلاً «شرکت سهامی خاص» */
  companyType: string | null;
  /** نام رسمی شرکت */
  name: string | null;
  nationalID: number | string | null;
  /** شماره ثبت */
  registerNumber: number | string | null;
  /** تاریخ ثبت، شمسی، فرمت «1400/01/01» */
  registerDate: string | null;
  /** وضعیت فعال بودن شرکت */
  active: boolean;
  /** آدرس ثبتی */
  address: string | null;
  postalCode: string | null;
  province: string | null;
  city: string | null;
  /** تاریخ انحلال — مقدار دارد فقط اگر شرکت منحل شده باشد */
  endDate: string | null;
}

/** Exactly api.ir's `ResultDataOfCompanyInfoRes` envelope. */
export type CompanyInfoResponse = ApiIrResult<CompanyInfoData>;

/**
 * Calls POST /api/sw1/CompanyInfo. Never throws — a missing token, bad
 * network, timeout, or unparseable response all come back as a
 * success:false envelope with a Persian `message`, same shape as a real
 * api.ir failure response, so a caller only branches on `.success`/`.data`
 * once, regardless of where the failure happened.
 */
export async function getCompanyInfo(nationalID: string): Promise<CompanyInfoResponse> {
  return callApiIr<CompanyInfoData>(COMPANY_INFO_PATH, { nationalID: nationalID.trim() });
}

// ---- ShahkarLite (احراز هویت شاهکار Lite) ----

/** Exactly api.ir's `ResultDataOfBoolean` envelope for ShahkarLite — `data` is a bare boolean, not an object, per the spec (true = این کد ملی و شماره موبایل به هم تعلق دارند). */
export type ShahkarLiteResponse = ApiIrResult<boolean>;

export async function getShahkarLite(nationalCode: string, mobile: string): Promise<ShahkarLiteResponse> {
  return callApiIr<boolean>("/api/sw1/ShahkarLite", { nationalCode: nationalCode.trim(), mobile: mobile.trim() });
}

// ---- PersonInfo (استعلام مشخصات هویتی) ----

/** Exactly api.ir's `PersonInfoRes` schema. */
export interface PersonInfoData {
  nationalCode: string | null;
  firstName: string | null;
  lastName: string | null;
  fatherName: string | null;
  /** کد عددی جنسیت — مقادیر مستند نشده در spec، همان‌طور که برمی‌گردد نمایش داده می‌شود. */
  gender: number | string | null;
  /** true = زنده */
  alive: boolean | null;
}

export type PersonInfoResponse = ApiIrResult<PersonInfoData>;

export async function getPersonInfo(nationalCode: string, birthDate: string): Promise<PersonInfoResponse> {
  return callApiIr<PersonInfoData>("/api/sw1/PersonInfo", { nationalCode: nationalCode.trim(), birthDate: birthDate.trim() });
}

// ---- VehicleInfo (استعلام مشخصات و مدل خودرو) ----

/** Exactly api.ir's `VehicleInfoRes` schema. */
export interface VehicleInfoData {
  name: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  vin: string | null;
  model: number | string | null;
}

export type VehicleInfoResponse = ApiIrResult<VehicleInfoData>;

export async function getVehicleInfo(nationalCode: string, plateNumber: string): Promise<VehicleInfoResponse> {
  return callApiIr<VehicleInfoData>("/api/sw1/VehicleInfo", { nationalCode: nationalCode.trim(), plateNumber: plateNumber.trim() });
}

// ---- WatterBillInfo (وب سرویس قبض آب با جزئیات — نام endpoint دقیقاً همین‌طور در مستندات api.ir آمده) ----

/** Exactly api.ir's `BillInfo` schema (nested under WatterBillInfoRes.info). */
export interface BillInfo {
  ownerName: string | null;
  address: string | null;
  postalCode: string | null;
  usageType: string | null;
  meterNumber: string | null;
  fileNumber: string | null;
  city: string | null;
  capacity: number | string | null;
  previousReadDate: string | null;
  currentReadDate: string | null;
  currentConsumption: number | string | null;
  previousNumber: number | string | null;
  currentNumber: number | string | null;
}

/** Exactly api.ir's `WatterBillInfoRes` schema. */
export interface WatterBillInfoData {
  info: BillInfo | null;
  /** رشته‌ی HTML/متن آماده‌ی چاپ قبض. */
  print: string;
  amount: number | string;
  billID: string;
  payID: string;
  date: string;
}

export type WatterBillInfoResponse = ApiIrResult<WatterBillInfoData>;

export async function getWatterBillInfo(billID: string): Promise<WatterBillInfoResponse> {
  return callApiIr<WatterBillInfoData>("/api/sw1/WatterBillInfo", { billID: billID.trim() });
}

// ---- Sandbox/Echo (تست و پیاده‌سازی) ----

/** Exactly api.ir's `EchoRes` schema. */
export interface EchoData {
  greeting: string | null;
  job: string | null;
  quirks: string[];
  /** Whether the bearer token used for this call is valid — the whole point of using this endpoint to test a token for free. */
  tokenStatus: boolean;
}

/** Exactly api.ir's `ResultDataOfEchoRes` envelope. */
export type EchoResponse = ApiIrResult<EchoData>;

/**
 * Calls POST /api/Sandbox/Echo — free, no real inquiry cost. Use this to
 * verify API_IR_TOKEN is valid (`response.data.tokenStatus`) before ever
 * spending a real CompanyInfo lookup.
 */
export async function getSandboxEcho(name = "تست اتصال"): Promise<EchoResponse> {
  return callApiIr<EchoData>(SANDBOX_ECHO_PATH, { name });
}

// ---- shared plumbing ----

type ApiIrEnvelope<T> = { success?: boolean; code?: number | string; message?: string | null; data?: T | null };

async function callApiIr<T>(path: string, body: Record<string, unknown>): Promise<ApiIrResult<T>> {
  const token = process.env.API_IR_TOKEN;
  if (!token) {
    return { success: false, code: -1, message: "سرویس استعلام هنوز پیکربندی نشده است.", data: null };
  }

  let response: Response;
  try {
    response = await fetch(`${API_IR_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // Covers both a real network failure and AbortSignal.timeout firing —
    // from the caller's side these need the same non-technical message.
    return {
      success: false,
      code: -1,
      message: "سرویس استعلام موقتاً در دسترس نیست، لطفاً بعداً تلاش کنید یا با پشتیبانی تماس بگیرید.",
      data: null,
    };
  }

  let parsed: ApiIrEnvelope<T> | null = null;
  try {
    parsed = (await response.json()) as ApiIrEnvelope<T>;
  } catch {
    // fall through with parsed === null — handled by the generic-failure branch below
  }

  if (!response.ok || !parsed) {
    return {
      success: false,
      code: response.status || -1,
      message: parsed?.message?.trim() || "سرویس استعلام موقتاً در دسترس نیست، لطفاً بعداً تلاش کنید یا با پشتیبانی تماس بگیرید.",
      data: null,
    };
  }

  return {
    success: parsed.success === true,
    code: typeof parsed.code === "string" ? Number(parsed.code) || 0 : (parsed.code ?? 0),
    message: parsed.message ?? null,
    data: parsed.success ? (parsed.data ?? null) : null,
  };
}
