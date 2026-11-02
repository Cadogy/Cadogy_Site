import Link from "next/link"

import { EmptyState } from "@/components/ui/empty-state"

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
    return <EmptyState>{emptyMessage}</EmptyState>
  }

  return (
    <div>
      <div className="hidden grid-cols-[140px_1fr_120px_120px_130px_150px] gap-4 pb-2 text-meta xl:grid">
        <span>Number</span>
        <span>Client</span>
        <span>Issued</span>
        <span>Due</span>
        <span className="text-right">Amount due</span>
        <span className="text-right">Status</span>
      </div>
      <ul className="rule-list">
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
                className="-mx-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-field px-3 py-4 transition-colors hover:bg-foreground/5 xl:grid-cols-[140px_1fr_120px_120px_130px_150px] xl:items-center"
              >
                <span className="font-medium">{invoice.number ?? "Draft"}</span>
                <span className="justify-self-end xl:order-last">
                  <StatusBadge status={invoiceBadge(invoice, now)} />
                </span>
                <span className="truncate text-sm text-muted-foreground xl:text-base xl:text-foreground">
                  {client}
                </span>
                <span className="justify-self-end font-medium xl:hidden">
                  {formatMoney(totals.amountDue, invoice.currency)}
                </span>
                <span className="hidden text-sm text-muted-foreground xl:block">
                  {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
                </span>
                <span className="col-span-2 text-sm text-muted-foreground xl:col-span-1">
                  <span className="xl:hidden">Due </span>
                  {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                </span>
                <span className="hidden text-right font-medium xl:block">
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
