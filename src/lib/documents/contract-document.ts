import path from "path";
import { prisma } from "@/lib/prisma";
import { formatJalali } from "@/lib/jalali";
import { getCompanyProfile } from "@/lib/documents/company";
import { renderPdf } from "@/lib/documents/carbone-client";

const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/documents/templates/contract.html");

// Independent of the app's theme-relative StatusBadge classes (accent-500 is
// orange in dark theme, blue in light theme) — a printed document needs fixed
// colors with unambiguous meaning regardless of which theme is active on screen.
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_APPROVAL: { bg: "#fef3c7", text: "#92400e", label: "در انتظار تأیید" },
  ACTIVE: { bg: "#d1fae5", text: "#065f46", label: "فعال" },
  RENEWING: { bg: "#dbeafe", text: "#1e40af", label: "در حال تمدید" },
  EXPIRED: { bg: "#f1f5f9", text: "#475569", label: "منقضی‌شده" },
  CANCELLED: { bg: "#fee2e2", text: "#991b1b", label: "لغوشده" },
};

export class ContractNotFoundError extends Error {}

async function buildContractData(contractId: string) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    include: { user: true },
  });

  if (!contract) {
    throw new ContractNotFoundError(`Contract not found: ${contractId}`);
  }

  const company = await getCompanyProfile();
  const status = STATUS_COLORS[contract.status] ?? STATUS_COLORS.ACTIVE;
  const now = new Date();

  return {
    company,
    customer: {
      name: contract.user.name || contract.user.email,
      phone: contract.user.phone ?? "—",
      address: contract.user.address ?? "",
      companyName: contract.user.customerType === "LEGAL" ? contract.user.companyName ?? "" : "",
      nationalId: contract.user.customerType === "LEGAL" ? contract.user.nationalId ?? "" : "",
    },
    contract: {
      id: contract.id,
      title: contract.title,
      type: contract.type,
      startDateJalali: formatJalali(contract.startDate),
      endDateJalali: formatJalali(contract.endDate),
      statusLabel: status.label,
      statusColorBg: status.bg,
      statusColorText: status.text,
    },
    issuedAtJalali: formatJalali(now),
  };
}

export async function renderContractPdf(contractId: string): Promise<{ buffer: Buffer; contractTitle: string }> {
  const data = await buildContractData(contractId);
  const buffer = await renderPdf(TEMPLATE_PATH, data);
  return { buffer, contractTitle: data.contract.title };
}

export async function getContractDocumentData(contractId: string) {
  return buildContractData(contractId);
}
