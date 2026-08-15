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
