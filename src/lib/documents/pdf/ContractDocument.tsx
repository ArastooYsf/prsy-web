import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { DocumentFooter, DocumentHeader, InfoRow, StatusBadge, colors, styles as shared } from "@/lib/documents/pdf/shared";
import type { ContractDocumentData } from "@/lib/documents/contract-document";

const styles = StyleSheet.create({
  bodyText: {
    fontSize: 12,
    lineHeight: 1.9,
    margin: 0,
    marginTop: 18,
    marginBottom: 18,
    padding: 14,
    backgroundColor: colors.panelBg,
    borderRadius: 8,
    textAlign: "right",
  },
  signGrid: { flexDirection: "row-reverse", marginTop: 60 },
  signCell: { flex: 1, textAlign: "center" },
  signLine: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
    paddingTop: 8,
    fontSize: 10,
    color: colors.muted,
  },
});

export default function ContractDocument({ data }: { data: ContractDocumentData }) {
  const { company, customer, contract, issuedAtJalali } = data;
  return (
    <Document>
      <Page size="A4" style={shared.page}>
        <DocumentHeader
          company={company}
          title="قرارداد رسمی"
          metaLines={[`شماره سند: ${contract.id}`, `تاریخ صدور: ${issuedAtJalali}`]}
        />

        <View style={shared.infoGrid}>
          <View style={shared.infoBox}>
            <Text style={shared.infoBoxTitle}>مشخصات طرف قرارداد (مشتری)</Text>
            <InfoRow label="نام" value={customer.name} />
            <InfoRow label="تلفن" value={customer.phone} />
            <InfoRow label="شرکت" value={customer.companyName} hidden={!customer.companyName} />
            <InfoRow label="شناسه ملی" value={customer.nationalId} hidden={!customer.nationalId} />
            <InfoRow label="آدرس" value={customer.address} hidden={!customer.address} />
          </View>
          <View style={shared.infoBox}>
            <Text style={shared.infoBoxTitle}>مشخصات قرارداد</Text>
            <InfoRow label="موضوع" value={contract.title} />
            <InfoRow label="نوع قرارداد" value={contract.type} />
            <InfoRow label="تاریخ شروع" value={contract.startDateJalali} />
            <InfoRow label="تاریخ پایان" value={contract.endDateJalali} />
            <View style={shared.statusRow}>
              <Text style={shared.infoLabel}>وضعیت: </Text>
              <StatusBadge label={contract.statusLabel} bg={contract.statusColorBg} textColor={contract.statusColorText} />
            </View>
          </View>
        </View>

        <Text style={styles.bodyText}>
          این سند گواهی می‌کند که قراردادی با موضوع «{contract.title}» از نوع «{contract.type}»، فی‌مابین شرکت{" "}
          {company.name} (شماره ثبت {company.registrationNumber}) به‌عنوان طرف اول، و {customer.name} به‌عنوان طرف
          دوم (مشتری)، منعقد گردیده است. مدت اعتبار این قرارداد از تاریخ {contract.startDateJalali} تا تاریخ{" "}
          {contract.endDateJalali} می‌باشد و طرفین متعهد به رعایت کامل مفاد آن هستند.
        </Text>

        <View style={styles.signGrid}>
          <View style={styles.signCell}>
            <Text style={styles.signLine}>امضا و مهر شرکت ({company.name})</Text>
          </View>
          <View style={styles.signCell}>
            <Text style={styles.signLine}>امضای مشتری ({customer.name})</Text>
          </View>
        </View>

        <DocumentFooter company={company} issuedAtJalali={issuedAtJalali} suffix="." />
      </Page>
    </Document>
  );
}
