import { Fragment } from "react"

import { siteConfig } from "@/config/site"
import { LogoMark } from "@/components/site/logo"

import { formatDate, formatMoney } from "../domain/format"
import type { ClientSnapshot, Invoice, InvoiceBadge } from "../domain/invoice"
import { calculateInvoiceTotals, calculateLineTotal } from "../domain/totals"
import { StatusBadge } from "./status-badge"

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "Card",
  bank_transfer: "Bank transfer",
  check: "Check",
  cash: "Cash",
  credit: "Credit balance",
  other: "Other",
}

const addressLines = (client: ClientSnapshot) =>
  [
    client.company,
    client.address.line1,
    client.address.line2,
    [client.address.city, client.address.region, client.address.postalCode]
      .filter(Boolean)
      .join(", "),
    client.address.country,
    client.taxId ? `Tax ID: ${client.taxId}` : "",
  ].filter(Boolean)

const formatQuantity = (quantity: number) =>
  Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2)

export function InvoiceDocument({
  invoice,
  client,
  status,
  headingLevel = 1,
}: {
  invoice: Invoice
  client: ClientSnapshot
  status: InvoiceBadge
  headingLevel?: 1 | 2
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2"
  const Subheading = headingLevel === 1 ? "h2" : "h3"
  const totals = calculateInvoiceTotals(invoice)
  const money = (amount: number) => formatMoney(amount, invoice.currency)

  return (
    <article className="panel text-card-foreground sm:p-10 print:border-0 print:p-0">
      <header className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Invoice</p>
          <Heading className="mt-1 text-title">
            {invoice.number ?? "Draft"}
          </Heading>
          <div className="mt-3">
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
          <span className="inline-flex items-center gap-2 text-lg font-medium">
            <LogoMark />
            {siteConfig.name}
          </span>
          <span className="text-sm text-muted-foreground">
            {siteConfig.email}
          </span>
        </div>
      </header>

      <dl className="mt-8 grid gap-6 border-t py-6 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Billed to</dt>
          <dd className="mt-1">
            <p className="font-medium">{client.name}</p>
            {addressLines(client).map((line) => (
              <p key={line} className="text-sm text-muted-foreground">
                {line}
              </p>
            ))}
            <p className="text-sm text-muted-foreground">{client.email}</p>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Issued</dt>
          <dd className="mt-1">
            {invoice.issueDate ? formatDate(invoice.issueDate) : "Not issued"}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Due</dt>
          <dd className="mt-1">
            {invoice.dueDate
              ? formatDate(invoice.dueDate)
              : invoice.termsDays === 0
                ? "On receipt"
                : `Net ${invoice.termsDays}`}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <div className="hidden grid-cols-[1fr_80px_120px_120px] gap-4 pb-2 text-meta sm:grid">
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit price</span>
          <span className="text-right">Amount</span>
        </div>
        <ul className="rule-list">
          {invoice.lineItems.map((item, index) => (
            <li
              key={`${item.description}-${index}`}
              className="grid gap-1 py-4 sm:grid-cols-[1fr_80px_120px_120px] sm:gap-4"
            >
              <span className="whitespace-pre-line">{item.description}</span>
              <span className="text-sm text-muted-foreground sm:text-right sm:text-base sm:text-foreground">
                <span className="sm:hidden">
                  {formatQuantity(item.quantity)} × {money(item.unitAmount)}
                </span>
                <span className="hidden sm:inline">
                  {formatQuantity(item.quantity)}
                </span>
              </span>
              <span className="hidden text-right sm:block">
                {money(item.unitAmount)}
              </span>
              <span className="font-medium sm:text-right">
                {money(calculateLineTotal(item))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-4 ml-auto grid max-w-xs gap-2 border-t pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{money(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Discount</dt>
            <dd>−{money(totals.discount)}</dd>
          </div>
        ) : null}
        {invoice.taxRateBps > 0 ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              Tax ({invoice.taxRateBps / 100}%)
            </dt>
            <dd>{money(totals.tax)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t pt-2 text-base font-medium">
          <dt>Total</dt>
          <dd>{money(totals.total)}</dd>
        </div>
        {totals.amountPaid > 0 ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Paid</dt>
            <dd>−{money(totals.amountPaid)}</dd>
          </div>
        ) : null}
        {invoice.adjustments.map((adjustment) => (
          <Fragment key={adjustment.creditNoteId}>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Credit note {adjustment.number}
              </dt>
              <dd>−{money(adjustment.amount)}</dd>
            </div>
            {adjustment.kind === "refund" ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Refunded to card</dt>
                <dd>+{money(adjustment.amount)}</dd>
              </div>
            ) : null}
          </Fragment>
        ))}
        <div className="flex justify-between rounded-field bg-muted px-3 py-2 text-base font-medium">
          <dt>Amount due</dt>
          <dd>{money(totals.amountDue)}</dd>
        </div>
      </dl>

      {invoice.payments.length > 0 ? (
        <section aria-labelledby="payments-title" className="mt-8">
          <Subheading id="payments-title" className="text-sm font-medium">
            Payments
          </Subheading>
          <ul className="mt-2 rule-list text-sm">
            {invoice.payments.map((payment, index) => (
              <li
                key={`${payment.paidAt.toISOString()}-${index}`}
                className="flex justify-between gap-4 py-2"
              >
                <span className="text-muted-foreground">
                  {formatDate(payment.paidAt)} ·{" "}
                  {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                </span>
                <span>{money(payment.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {invoice.memo ? (
        <section className="mt-8 text-sm whitespace-pre-line text-muted-foreground">
          {invoice.memo}
        </section>
      ) : null}
      {invoice.footer ? (
        <footer className="mt-8 border-t pt-4 text-xs text-muted-foreground">
          {invoice.footer}
        </footer>
      ) : null}
    </article>
  )
}
