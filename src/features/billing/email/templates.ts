import { emailButton, emailLayout, escapeHtml } from "@/lib/email/html"

import type { BillingNotification } from "../application/ports"
import { formatDate, formatMoney } from "../domain/format"
import type { Invoice } from "../domain/invoice"
import { calculateInvoiceTotals } from "../domain/totals"

type RenderInput = {
  readonly kind: BillingNotification["kind"]
  readonly invoice: Invoice
  readonly baseUrl: string
}

type RenderedEmail = {
  readonly subject: string
  readonly html: string
  readonly text: string
}

const invoiceUrl = (baseUrl: string, invoice: Invoice) =>
  `${baseUrl}/invoice/${invoice.publicToken}`

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;">${escapeHtml(text)}</p>`

const render = (
  input: RenderInput,
  {
    subject,
    lines,
    cta,
  }: { subject: string; lines: readonly string[]; cta: string }
): RenderedEmail => {
  const url = invoiceUrl(input.baseUrl, input.invoice)
  return {
    subject,
    html: emailLayout({
      baseUrl: input.baseUrl,
      preheader: lines[1] ?? subject,
      body: `${lines.map(paragraph).join("")}${emailButton(url, cta)}${paragraph(
        "Questions about this invoice? Just reply to this email."
      )}`,
    }),
    text: [...lines, "", `${cta}: ${url}`].join("\n"),
  }
}

export const renderBillingEmail = (input: RenderInput): RenderedEmail => {
  const { invoice } = input
  const totals = calculateInvoiceTotals(invoice)
  const money = (amount: number) => formatMoney(amount, invoice.currency)
  const number = invoice.number ?? "draft"
  const due = invoice.dueDate ? formatDate(invoice.dueDate) : "on receipt"
  const greeting = `Hi ${invoice.clientSnapshot?.name ?? "there"},`

  if (input.kind === "issued") {
    return render(input, {
      subject: `Invoice ${number} from Cadogy — ${money(totals.amountDue)} due ${due}`,
      lines: [
        greeting,
        `Invoice ${number} for ${money(totals.total)} is ready. Payment is due ${due}.`,
        "You can view, download or pay it online using the link below.",
      ],
      cta: "View and pay invoice",
    })
  }

  if (input.kind === "reminder") {
    return render(input, {
      subject: `Reminder: invoice ${number} — ${money(totals.amountDue)} due ${due}`,
      lines: [
        greeting,
        `A friendly reminder that ${money(totals.amountDue)} remains due on invoice ${number} (due ${due}).`,
        "If you've already sent payment, thank you — you can ignore this message.",
      ],
      cta: "View and pay invoice",
    })
  }

  if (input.kind === "autopay_failed") {
    return render(input, {
      subject: `Action needed: payment for invoice ${number} didn't go through`,
      lines: [
        greeting,
        `We couldn't charge your saved card for invoice ${number} (${money(totals.amountDue)}).`,
        "This usually means the card has expired or the bank declined it. You can pay online in a few seconds, and update your saved card from your client dashboard.",
      ],
      cta: "Pay invoice",
    })
  }

  const latest = invoice.payments.at(-1)
  const received = money(latest?.amount ?? 0)
  return render(input, {
    subject: `Receipt for invoice ${number} — ${received} received`,
    lines: [
      greeting,
      `We received your payment of ${received} for invoice ${number}. Thank you.`,
      totals.amountDue === 0
        ? "Paid in full."
        : `Remaining balance: ${money(totals.amountDue)}.`,
    ],
    cta: "View receipt",
  })
}
