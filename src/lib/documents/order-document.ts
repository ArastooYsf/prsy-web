import path from "path";
import { prisma } from "@/lib/prisma";
import { formatJalali } from "@/lib/jalali";
import { formatNumber, toPersianDigits } from "@/lib/format-number";
import { getCompanyProfile } from "@/lib/documents/company";
import { renderPdf } from "@/lib/documents/carbone-client";

const TEMPLATE_PATH = path.join(process.cwd(), "src/lib/documents/templates/order.html");

// Same rationale as contract-document.ts: fixed, theme-independent colors for
// a printed/downloaded document rather than the app's theme-relative classes.
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "#fef3c7", text: "#92400e", label: "در انتظار تأیید" },
  PROCESSING: { bg: "#dbeafe", text: "#1e40af", label: "در حال آماده‌سازی" },
  SHIPPED: { bg: "#dbeafe", text: "#1e40af", label: "ارسال‌شده" },
  DELIVERED: { bg: "#d1fae5", text: "#065f46", label: "تحویل داده‌شده" },
  CANCELLED: { bg: "#fee2e2", text: "#991b1b", label: "لغوشده" },
};

export class OrderNotFoundError extends Error {}

async function buildOrderData(orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
    include: { user: true, items: true },
  });

  if (!order) {
    throw new OrderNotFoundError(`Order not found: ${orderId}`);
  }

  const company = await getCompanyProfile();
  const status = STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
  const now = new Date();

  let grandTotal = 0;
  const items = order.items.map((item, index) => {
    const unitPrice = item.price ?? 0;
    const lineTotal = unitPrice * item.quantity;
    grandTotal += lineTotal;
    return {
      row: toPersianDigits(index + 1),
      name: item.productName,
      isCatalog: item.productId !== null,
      quantity: formatNumber(item.quantity),
      unitPriceFormatted: formatNumber(unitPrice),
      lineTotalFormatted: formatNumber(lineTotal),
    };
  });

  return {
    company,
    customer: {
      name: order.user.name || order.user.email,
      phone: order.user.phone ?? "—",
      address: order.user.address ?? "",
      companyName: order.user.customerType === "LEGAL" ? order.user.companyName ?? "" : "",
    },
    order: {
      orderNumber: order.orderNumber,
      createdAtJalali: formatJalali(order.createdAt),
      itemCount: formatNumber(order.items.length),
      statusLabel: status.label,
      statusColorBg: status.bg,
      statusColorText: status.text,
      grandTotalFormatted: formatNumber(grandTotal),
    },
    items,
    issuedAtJalali: formatJalali(now),
  };
}

export async function renderOrderPdf(orderId: string): Promise<{ buffer: Buffer; orderNumber: string }> {
  const data = await buildOrderData(orderId);
  const buffer = await renderPdf(TEMPLATE_PATH, data);
  return { buffer, orderNumber: data.order.orderNumber };
}

export async function getOrderDocumentData(orderId: string) {
  return buildOrderData(orderId);
}
