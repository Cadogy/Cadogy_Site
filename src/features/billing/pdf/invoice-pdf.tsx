import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { siteConfig } from "@/config/site"
import { color } from "@/lib/email/theme"

import {
  clientAddressLines,
  formatDate,
  formatMoney,
  formatQuantity,
  PAYMENT_METHOD_LABELS,
} from "../domain/format"
import type { Invoice } from "../domain/invoice"
import { calculateInvoiceTotals, calculateLineTotal } from "../domain/totals"

// Printed documents share the email palette.
const ink = color.text
const muted = color.muted
const rule = color.border

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingHorizontal: 52,
    paddingBottom: 64,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.45,
    color: ink,
  },
  header: { flexDirection: "row", justifyContent: "space-between" },
  brand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  muted: { color: muted },
  kicker: { color: muted, fontSize: 9 },
  title: { fontFamily: "Helvetica-Bold", fontSize: 22, marginTop: 2 },
  stamp: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: ink,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 0.6,
  },
  meta: {
    flexDirection: "row",
    marginTop: 28,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: rule,
  },
  metaCell: { flex: 1, paddingRight: 12 },
  strong: { fontFamily: "Helvetica-Bold" },
  table: { marginTop: 24 },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: rule,
  },
  headRow: { flexDirection: "row", paddingBottom: 6 },
  description: { flex: 1, paddingRight: 12 },
  qty: { width: 56, textAlign: "right" },
  price: { width: 80, textAlign: "right" },
  amount: { width: 84, textAlign: "right" },
  totals: { marginTop: 16, marginLeft: "auto", width: 240 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  dueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: color.surface,
    borderRadius: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  section: { marginTop: 28 },
  sectionTitle: { fontFamily: "Helvetica-Bold", marginBottom: 6 },
  footer: {
    position: "absolute",
    bottom: 32,
    color: muted,
    fontSize: 8,
  },
})

const STAMPS: Partial<Record<Invoice["status"], string>> = {
  paid: "PAID",
  void: "VOID",
  uncollectible: "UNCOLLECTIBLE",
}

function InvoicePdf({ invoice }: { invoice: Invoice }) {
  const client = invoice.clientSnapshot
  const totals = calculateInvoiceTotals(invoice)
  const money = (amount: number) => formatMoney(amount, invoice.currency)
  const number = invoice.number ?? "Draft"
  const isReceipt = invoice.status === "paid"
  const stamp = STAMPS[invoice.status]

  return (
    <Document
      title={`${isReceipt ? "Receipt" : "Invoice"} ${number}`}
      author={siteConfig.name}
      subject={`${siteConfig.name} invoice ${number}`}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>
              {isReceipt ? "Receipt" : "Invoice"}
            </Text>
            <Text style={styles.title}>{number}</Text>
            {stamp ? <Text style={styles.stamp}>{stamp}</Text> : null}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.brand}>{siteConfig.name}</Text>
            <Text style={styles.muted}>{siteConfig.email}</Text>
            <Text style={styles.muted}>
              {new URL(siteConfig.url).host.replace(/^www\./, "")}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaCell}>
            <Text style={styles.kicker}>Billed to</Text>
            {client ? (
              <>
                <Text style={[styles.strong, { marginTop: 3 }]}>
                  {client.name}
                </Text>
                {clientAddressLines(client, { withEmail: true }).map((line) => (
                  <Text key={line} style={styles.muted}>
                    {line}
                  </Text>
                ))}
              </>
            ) : null}
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.kicker}>Issued</Text>
            <Text style={{ marginTop: 3 }}>
              {invoice.issueDate ? formatDate(invoice.issueDate) : "Not issued"}
            </Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.kicker}>Due</Text>
            <Text style={{ marginTop: 3 }}>
              {invoice.dueDate
                ? formatDate(invoice.dueDate)
                : invoice.termsDays === 0
                  ? "On receipt"
                  : `Net ${invoice.termsDays}`}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.headRow} fixed>
            <Text style={[styles.description, styles.kicker]}>Description</Text>
            <Text style={[styles.qty, styles.kicker]}>Qty</Text>
            <Text style={[styles.price, styles.kicker]}>Unit price</Text>
            <Text style={[styles.amount, styles.kicker]}>Amount</Text>
          </View>
          {invoice.lineItems.map((item, index) => (
            <View
              key={`${item.description}-${index}`}
              style={styles.row}
              wrap={false}
            >
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.qty}>{formatQuantity(item)}</Text>
              <Text style={styles.price}>{money(item.unitAmount)}</Text>
              <Text style={styles.amount}>
                {money(calculateLineTotal(item))}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{money(totals.subtotal)}</Text>
          </View>
          {totals.discount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Discount</Text>
              <Text>-{money(totals.discount)}</Text>
            </View>
          ) : null}
          {invoice.taxRateBps > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>
                Tax ({invoice.taxRateBps / 100}%)
              </Text>
              <Text>{money(totals.tax)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalRow, styles.strong]}>
            <Text>Total</Text>
            <Text>{money(totals.total)}</Text>
          </View>
          {totals.amountPaid > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.muted}>Paid</Text>
              <Text>-{money(totals.amountPaid)}</Text>
            </View>
          ) : null}
          {invoice.adjustments.map((adjustment) => (
            <View key={adjustment.creditNoteId} style={styles.totalRow}>
              <Text style={styles.muted}>Credit note {adjustment.number}</Text>
              <Text>-{money(adjustment.amount)}</Text>
            </View>
          ))}
          <View style={styles.dueRow}>
            <Text>Amount due</Text>
            <Text>{money(totals.amountDue)}</Text>
          </View>
        </View>

        {invoice.payments.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Payments</Text>
            {invoice.payments.map((payment, index) => (
              <View
                key={`${payment.paidAt.toISOString()}-${index}`}
                style={styles.totalRow}
              >
                <Text style={styles.muted}>
                  {formatDate(payment.paidAt)} ·{" "}
                  {PAYMENT_METHOD_LABELS[payment.method]}
                </Text>
                <Text>{money(payment.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {invoice.memo ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.muted}>{invoice.memo}</Text>
          </View>
        ) : null}
        {invoice.footer ? (
          <View style={styles.section}>
            <Text style={styles.muted}>{invoice.footer}</Text>
          </View>
        ) : null}

        <Text style={[styles.footer, { left: 52 }]} fixed>
          {siteConfig.name} · {siteConfig.location.label} · {siteConfig.email}
        </Text>
        <Text
          style={[styles.footer, { left: 52, right: 52, textAlign: "right" }]}
          fixed
        >
          {isReceipt ? "Receipt" : "Invoice"} {number}
        </Text>
      </Page>
    </Document>
  )
}

export const invoicePdfFilename = (invoice: Invoice) =>
  `${invoice.status === "paid" ? "Receipt" : "Invoice"} ${invoice.number ?? "draft"}.pdf`

export const renderInvoicePdf = (invoice: Invoice) =>
  renderToBuffer(<InvoicePdf invoice={invoice} />)
