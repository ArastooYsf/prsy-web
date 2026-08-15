import { generate, generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

const ISSUER = "Yashar Industry";
// Tolerate one 30s step of clock drift on either side of the current step.
const EPOCH_TOLERANCE_SECONDS = 30;

export function createTwoFactorSecret(): string {
  return generateSecret();
}

export async function twoFactorQrCodeDataUrl(email: string, secret: string): Promise<string> {
  const otpauthUrl = generateURI({ issuer: ISSUER, label: email, secret });
  return QRCode.toDataURL(otpauthUrl);
}

export async function verifyTwoFactorCode(secret: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const result = await verify({ secret, token: code, epochTolerance: EPOCH_TOLERANCE_SECONDS });
  return result.valid;
}

// Only used by tests/scripts that need to generate a valid code for a known
// secret (e.g. verifying the whole flow without a real authenticator app).
export async function generateTwoFactorCode(secret: string): Promise<string> {
  return generate({ secret });
}
