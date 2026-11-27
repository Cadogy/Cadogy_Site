import type { DetailRow } from "@/lib/email/components"
import { renderEmail } from "@/lib/email/render"

import type { BillingNotification } from "../application/ports"
import { DAY_MS, startOfUtcDay } from "../domain/dates"
import {
  clientDisplayName,
  formatDate,
  formatMoney,
  PAYMENT_METHOD_LABELS,
} from "../domain/format"
import { invoicePublicPath, type Invoice } from "../domain/invoice"
import {
  calculateInvoiceTotals,
  calculateLineTotal,
  sum,
} from "../domain/totals"
import { InvoiceEmail, type InvoiceEmailProps } from "./invoice-email"

type RenderInput = {
  readonly kind: BillingNotification["kind"]
  readonly invoice: Invoice
  readonly baseUrl: string
  /** Whether a PDF copy goes with the email. */
  readonly attached?: boolean
  /** For reminder wording: before, on or after the due date. */
  readonly now?: Date
}

type RenderedEmail = {
  readonly subject: string
  readonly html: string
  readonly text: string
}

const SHOWN_LINES = 4

const shorten = (text: string, max = 64) => {
  const line = text.split("\n")[0] ?? text
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line
}

/** The invoice in a few rows: its first lines, then the totals. */
const summaryRows = (invoice: Invoice): DetailRow[] => {
  const totals = calculateInvoiceTotals(invoice)
  const money = (amount: number) => formatMoney(amount, invoice.currency)
  const lines = invoice.lineItems.slice(0, SHOWN_LINES).map((item) => ({
    label: shorten(item.description),
    value: money(calculateLineTotal(item)),
  }))
  const hidden = invoice.lineItems.length - SHOWN_LINES
  const paid = sum(invoice.payments.map((payment) => payment.amount))
  return [
    ...lines,
    ...(hidden > 0
      ? [
          {
            label: `and ${hidden} more ${hidden === 1 ? "item" : "items"}`,
            value: "",
          },
        ]
      : []),
    ...(totals.discount > 0
      ? [{ label: "Discount", value: `−${money(totals.discount)}` }]
      : []),
    ...(totals.tax > 0
      ? [
          {
            label: `Tax (${invoice.taxRateBps / 100}%)`,
            value: money(totals.tax),
          },
        ]
      : []),
    { label: "Total", value: money(totals.total), strong: true },
    ...(paid > 0 ? [{ label: "Paid", value: `−${money(paid)}` }] : []),
    ...(totals.credited > 0
      ? [{ label: "Credited", value: `−${money(totals.credited)}` }]
      : []),
    { label: "Amount due", value: money(totals.amountDue), strong: true },
  ]
}

const daysPastDue = (dueDate: Date, now: Date) =>
  Math.round(
    (startOfUtcDay(now).getTime() - startOfUtcDay(dueDate).getTime()) / DAY_MS
  )

export const renderBillingEmail = async (
  input: RenderInput
): Promise<RenderedEmail> => {
  const { invoice, baseUrl, attached = false } = input
  const totals = calculateInvoiceTotals(invoice)
  const money = (amount: number) => formatMoney(amount, invoice.currency)
  const number = invoice.number ?? "draft"
  const due = invoice.dueDate ? formatDate(invoice.dueDate) : "on receipt"
  const client = invoice.clientSnapshot
  const firstName = client?.name.trim().split(/\s+/)[0]
  const greeting = `Hi ${firstName || "there"},`
  const url = `${baseUrl}${invoicePublicPath(invoice.publicToken)}`
  const pdfNote = attached ? " A PDF copy is attached." : ""
  const base = {
    baseUrl,
    reason: `You're receiving this because you're a billing contact for ${(client
      ? clientDisplayName(client)
      : "this account"
    ).replace(/\.$/, "")}.`,
    greeting,
    url,
    summary: summaryRows(invoice),
    closing: "Questions about this invoice? Reply to this email.",
  }

  const finish = async (
    subject: string,
    props: Omit<InvoiceEmailProps, keyof typeof base | "preview"> & {
      preview: string
    }
  ): Promise<RenderedEmail> => ({
    subject,
    ...(await renderEmail(<InvoiceEmail {...base} {...props} />)),
  })

  if (input.kind === "issued") {
    const credit = sum(
      invoice.payments
        .filter((payment) => payment.method === "credit")
        .map((payment) => payment.amount)
    )
    if (credit > 0 && totals.amountDue === 0) {
      return finish(`Invoice ${number} from Cadogy — paid from your credit`, {
        preview: `Invoice ${number} for ${money(totals.total)} is paid in full from your account credit.`,
        eyebrow: `Invoice ${number}`,
        title: "Your invoice from Cadogy",
        intro: [
          `Invoice ${number} for ${money(totals.total)} is ready. It's been paid in full from your account credit, so there's nothing to pay.${pdfNote}`,
        ],
        amount: {
          label: "Paid from your credit",
          value: money(totals.total),
          note: "Nothing to pay",
        },
        cta: "View invoice",
      })
    }
    return finish(
      `Invoice ${number} from Cadogy — ${money(totals.amountDue)} due ${due}`,
      {
        preview: `${money(totals.amountDue)} due ${due}. View and pay online.`,
        eyebrow: `Invoice ${number}`,
        title: "Your invoice from Cadogy",
        intro: [
          credit > 0
            ? `Invoice ${number} for ${money(totals.total)} is ready. We applied ${money(credit)} of your account credit, so ${money(totals.amountDue)} is due ${due}.${pdfNote}`
            : `Invoice ${number} is ready. You can view, download or pay it online.${pdfNote}`,
        ],
        amount: {
          label: "Amount due",
          value: money(totals.amountDue),
          note: invoice.dueDate ? `Due ${due}` : "Due on receipt",
        },
        cta: "View and pay invoice",
      }
    )
  }

  if (input.kind === "reminder") {
    const days = invoice.dueDate
      ? daysPastDue(invoice.dueDate, input.now ?? new Date())
      : null
    const title =
      days === null
        ? `Invoice ${number} is waiting for payment`
        : days < 0
          ? `Invoice ${number} is due ${due}`
          : days === 0
            ? `Invoice ${number} is due today`
            : `Invoice ${number} is ${days} ${days === 1 ? "day" : "days"} overdue`
    return finish(
      `Reminder: invoice ${number} — ${money(totals.amountDue)} due ${due}`,
      {
        preview: `${money(totals.amountDue)} remains on invoice ${number}.`,
        eyebrow: "Payment reminder",
        title,
        intro: [
          days !== null && days > 0
            ? `Payment for invoice ${number} was due ${due}, and ${money(totals.amountDue)} remains. If something's holding it up, reply and let us know.`
            : `A friendly reminder that ${money(totals.amountDue)} remains due on invoice ${number}.`,
          `If you've already sent payment, thank you. You can ignore this message.${pdfNote}`,
        ],
        amount: {
          label: "Amount due",
          value: money(totals.amountDue),
          note: invoice.dueDate ? `Due ${due}` : "Due on receipt",
        },
        cta: "View and pay invoice",
      }
    )
  }

  if (input.kind === "autopay_failed") {
    return finish(
      `Action needed: payment for invoice ${number} didn't go through`,
      {
        preview: `We couldn't charge your saved card for invoice ${number}.`,
        eyebrow: `Invoice ${number}`,
        title: "Your payment didn't go through",
        intro: [
          `We couldn't charge your saved card for invoice ${number} (${money(totals.amountDue)}).${pdfNote}`,
        ],
        notice:
          "This usually means the card has expired or the bank declined it. You can pay online in a few seconds, and update your saved card from your billing page.",
        amount: {
          label: "Amount due",
          value: money(totals.amountDue),
          note: invoice.dueDate ? `Due ${due}` : "Due on receipt",
        },
        cta: "Pay invoice",
        secondary: {
          href: `${baseUrl}/dashboard/billing`,
          label: "Update your saved card",
        },
      }
    )
  }

  const latest = invoice.payments.at(-1)
  const received = money(latest?.amount ?? 0)
  const paidInFull = totals.amountDue === 0
  return finish(`Receipt for invoice ${number} — ${received} received`, {
    preview: `We received your payment of ${received}. Thank you.`,
    eyebrow: `Receipt · Invoice ${number}`,
    title: "Payment received",
    intro: [
      `We received your payment of ${received} for invoice ${number}. Thank you.${pdfNote}`,
    ],
    amount: {
      label: "Amount paid",
      value: received,
      note: [
        latest ? formatDate(latest.paidAt) : "",
        latest ? PAYMENT_METHOD_LABELS[latest.method] : "",
        paidInFull
          ? "Paid in full."
          : `Remaining balance: ${money(totals.amountDue)}.`,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    cta: "View receipt",
  })
}
