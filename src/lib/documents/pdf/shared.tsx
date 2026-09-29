import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { FONT_FAMILY } from "@/lib/documents/pdf/fonts";
import type { CompanyProfile } from "@/lib/documents/company";

// Numeric values ported 1:1 from the old Carbone HTML templates' px units
// (src/lib/documents/templates/*.html) — not pixel-perfect against a browser
// render, but the same relative proportions/colors, which is what "same
// document" means for a generated PDF.
export const colors = {
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  brand: "#1d4ed8",
  brandSoft: "#eff6ff",
  panelBg: "#f8fafc",
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    color: colors.text,
    fontSize: 13,
    lineHeight: 1.6,
    paddingVertical: 24,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: colors.brand,
    paddingBottom: 12,
    marginBottom: 20,
  },
  headerLeft: { width: "58%" },
  headerRight: { width: "40%" },
  brandRow: { flexDirection: "row-reverse", alignItems: "center" },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.brand,
    color: colors.brandSoft,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 8,
  },
  brandName: { fontSize: 15, fontWeight: "bold", marginRight: 8, textAlign: "right" },
  companyMeta: { color: colors.muted, fontSize: 10, marginTop: 6, textAlign: "right", lineHeight: 1.6 },
  docTitle: { fontSize: 18, fontWeight: "bold", textAlign: "left" },
  docMeta: { color: colors.muted, fontSize: 10, textAlign: "left", marginTop: 6, lineHeight: 1.6 },

  infoGrid: { flexDirection: "row-reverse", marginBottom: 18, gap: 12 },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  infoBoxTitle: { fontSize: 11, color: colors.brand, fontWeight: "bold", marginBottom: 8, textAlign: "right" },
  infoRow: { fontSize: 11, marginBottom: 5, textAlign: "right" },
  infoLabel: { color: colors.muted },
  // The status row holds a pill-shaped badge, not inline text, so it needs
  // an actual flex row (unlike infoRow above, which is plain nested Text).
  statusRow: { flexDirection: "row-reverse", alignItems: "center", fontSize: 11, marginBottom: 5 },

  statusBadge: {
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 10,
    fontSize: 10,
    fontWeight: "bold",
  },

  footer: {
    marginTop: 28,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
  },
});

export function DocumentHeader({
  company,
  title,
  metaLines,
}: {
  company: CompanyProfile;
  title: string;
  /** Right-aligned lines under the doc title, e.g. document number + issue date. */
  metaLines: string[];
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.brandRow}>
          <Text style={styles.brandMark}>یا</Text>
          <Text style={styles.brandName}>{company.name}</Text>
        </View>
        <Text style={styles.companyMeta}>
          شماره ثبت: {company.registrationNumber} | {company.address}
          {"\n"}
          {company.phone} | {company.email}
        </Text>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.docTitle}>{title}</Text>
        <Text style={styles.docMeta}>{metaLines.join("\n")}</Text>
      </View>
    </View>
  );
}

export function InfoRow({ label, value, hidden }: { label: string; value: string; hidden?: boolean }) {
  if (hidden || !value) return null;
  return (
    <Text style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

export function StatusBadge({ label, bg, textColor }: { label: string; bg: string; textColor: string }) {
  return <Text style={[styles.statusBadge, { backgroundColor: bg, color: textColor }]}>{label}</Text>;
}

export function DocumentFooter({ company, issuedAtJalali, suffix }: { company: CompanyProfile; issuedAtJalali: string; suffix: string }) {
  return (
    <Text style={styles.footer}>
      این سند به‌صورت خودکار در تاریخ {issuedAtJalali} توسط سامانه {company.name} تولید شده است{suffix}
    </Text>
  );
}
