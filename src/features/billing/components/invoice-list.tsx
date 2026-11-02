import Link from "next/link"

import { formatDate, formatMoney } from "../domain/format"
import type { Invoice } from "../domain/invoice"
import { invoiceBadge } from "../domain/lifecycle"
import { calculateInvoiceTotals } from "../domain/totals"
import { StatusBadge } from "./status-badge"

export function InvoiceList({
  invoices,
  hrefFor,
  now,
  emptyMessage,
}: {
  invoices: readonly Invoice[]
  hrefFor: (invoice: Invoice) => string
  now: Date
  emptyMessage: string
}) {
  if (invoices.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="hidden grid-cols-[140px_1fr_120px_120px_130px_150px] gap-4 border-b bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground md:grid">
        <span>Number</span>
        <span>Client</span>
        <span>Issued</span>
        <span>Due</span>
        <span className="text-right">Amount due</span>
        <span className="text-right">Status</span>
      </div>
      <ul className="divide-y">
        {invoices.map((invoice) => {
          const totals = calculateInvoiceTotals(invoice)
          const client =
            invoice.clientSnapshot?.company ||
            invoice.clientSnapshot?.name ||
            "Draft"
          return (
            <li key={invoice.id}>
              <Link
                href={hrefFor(invoice)}
                className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-4 py-4 transition-colors hover:bg-accent/50 md:grid-cols-[140px_1fr_120px_120px_130px_150px] md:items-center"
              >
                <span className="font-medium">{invoice.number ?? "Draft"}</span>
                <span className="justify-self-end md:order-last">
                  <StatusBadge status={invoiceBadge(invoice, now)} />
                </span>
                <span className="truncate text-sm text-muted-foreground md:text-base md:text-foreground">
                  {client}
                </span>
                <span className="justify-self-end font-medium md:hidden">
                  {formatMoney(totals.amountDue, invoice.currency)}
                </span>
                <span className="hidden text-sm text-muted-foreground md:block">
                  {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
                </span>
                <span className="col-span-2 text-sm text-muted-foreground md:col-span-1">
                  <span className="md:hidden">Due </span>
                  {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                </span>
                <span className="hidden text-right font-medium md:block">
                  {formatMoney(totals.amountDue, invoice.currency)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
