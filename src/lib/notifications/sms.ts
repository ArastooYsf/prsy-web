const KAVENEGAR_API_KEY = process.env.KAVENEGAR_API_KEY;
const KAVENEGAR_SENDER_LINE = process.env.KAVENEGAR_SENDER_LINE;

type KavenegarResponse = {
  return?: { status?: number; message?: string };
};

export async function sendSms({ to, message }: { to: string; message: string }): Promise<void> {
  if (!KAVENEGAR_API_KEY) {
    throw new Error("KAVENEGAR_API_KEY تنظیم نشده است.");
  }

  const params = new URLSearchParams({ receptor: to, message });
  if (KAVENEGAR_SENDER_LINE) {
    params.set("sender", KAVENEGAR_SENDER_LINE);
  }

  const res = await fetch(`https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/sms/send.json?${params.toString()}`);
  const data: KavenegarResponse | null = await res.json().catch(() => null);

  if (!res.ok || data?.return?.status !== 200) {
    throw new Error(data?.return?.message || `درخواست کاوه‌نگار با کد ${res.status} شکست خورد.`);
  }
}

type KavenegarAccountInfoResponse = {
  return?: { status?: number; message?: string };
  entries?: { remaincredit?: number };
};

/** Free, no-SMS-sent account lookup — used for the integrations hub's "تست اتصال", separate from the real (billable) sendSms above. */
export async function getKavenegarAccountInfo(): Promise<{ remainingCredit: number | null }> {
  if (!KAVENEGAR_API_KEY) {
    throw new Error("KAVENEGAR_API_KEY تنظیم نشده است.");
  }

  const res = await fetch(`https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/account/info.json`);
  const data: KavenegarAccountInfoResponse | null = await res.json().catch(() => null);

  if (!res.ok || data?.return?.status !== 200) {
    throw new Error(data?.return?.message || `درخواست کاوه‌نگار با کد ${res.status} شکست خورد.`);
  }

  return { remainingCredit: data?.entries?.remaincredit ?? null };
}
