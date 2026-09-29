import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { DocumentFooter, DocumentHeader, InfoRow, StatusBadge, colors, styles as shared } from "@/lib/documents/pdf/shared";
import type { OrderDocumentData } from "@/lib/documents/order-document";

const COLS = {
  row: "6%",
  name: "46%",
  quantity: "12%",
  unitPrice: "18%",
  lineTotal: "18%",
};

const styles = StyleSheet.create({
  table: { marginTop: 4, borderWidth: 1, borderColor: colors.border },
  headRow: { flexDirection: "row-reverse", backgroundColor: "#f1f5f9" },
  th: {
    fontSize: 10,
    color: "#334155",
    padding: 8,
    borderColor: colors.border,
    borderRightWidth: 1,
    textAlign: "right",
  },
  bodyRow: { flexDirection: "row-reverse", borderTopWidth: 1, borderTopColor: colors.border },
  td: {
    fontSize: 11,
    padding: 8,
    borderColor: colors.border,
    borderRightWidth: 1,
    textAlign: "right",
  },
  num: { textAlign: "left" },
  catalogTag: {
    marginTop: 3,
    alignSelf: "flex-end",
    fontSize: 8,
    color: colors.brand,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 4,
  },
  totals: { flexDirection: "row-reverse", justifyContent: "flex-start", marginTop: 12 },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: colors.brand,
    paddingTop: 10,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
  },
});

export default function OrderDocument({ data }: { data: OrderDocumentData }) {
  const { company, customer, order, items, issuedAtJalali } = data;
  return (
    <Document>
      <Page size="A4" style={shared.page}>
        <DocumentHeader
          company={company}
          title="فاکتور سفارش"
          metaLines={[`شماره سفارش: ${order.orderNumber}`, `تاریخ ثبت: ${order.createdAtJalali}`]}
        />

        <View style={shared.infoGrid}>
          <View style={shared.infoBox}>
            <Text style={shared.infoBoxTitle}>مشخصات مشتری</Text>
            <InfoRow label="نام" value={customer.name} />
            <InfoRow label="تلفن" value={customer.phone} />
            <InfoRow label="شرکت" value={customer.companyName} hidden={!customer.companyName} />
            <InfoRow label="آدرس" value={customer.address} hidden={!customer.address} />
          </View>
          <View style={shared.infoBox}>
            <Text style={shared.infoBoxTitle}>مشخصات سفارش</Text>
            <InfoRow label="شماره سفارش" value={order.orderNumber} />
            <InfoRow label="تعداد اقلام" value={order.itemCount} />
            <View style={shared.statusRow}>
              <Text style={shared.infoLabel}>وضعیت: </Text>
              <StatusBadge label={order.statusLabel} bg={order.statusColorBg} textColor={order.statusColorText} />
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.headRow}>
            <Text style={[styles.th, { width: COLS.row }]}>ردیف</Text>
            <Text style={[styles.th, { width: COLS.name }]}>شرح کالا / خدمات</Text>
            <Text style={[styles.th, { width: COLS.quantity }]}>تعداد</Text>
            <Text style={[styles.th, { width: COLS.unitPrice }]}>قیمت واحد (تومان)</Text>
            <Text style={[styles.th, { width: COLS.lineTotal, borderRightWidth: 0 }]}>قیمت کل (تومان)</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.bodyRow}>
              <Text style={[styles.td, styles.num, { width: COLS.row }]}>{item.row}</Text>
              <View style={[styles.td, { width: COLS.name }]}>
                <Text>{item.name}</Text>
                {item.isCatalog && <Text style={styles.catalogTag}>کاتالوگ</Text>}
              </View>
              <Text style={[styles.td, styles.num, { width: COLS.quantity }]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.num, { width: COLS.unitPrice }]}>{item.unitPriceFormatted}</Text>
              <Text style={[styles.td, styles.num, { width: COLS.lineTotal, borderRightWidth: 0 }]}>{item.lineTotalFormatted}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <Text style={styles.grandTotal}>جمع کل: {order.grandTotalFormatted} تومان</Text>
        </View>

        <DocumentFooter company={company} issuedAtJalali={issuedAtJalali} suffix=" و به‌منزله‌ی فاکتور رسمی می‌باشد." />
      </Page>
    </Document>
  );
}
