import Link from "next/link"

import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"

import { formatDate, formatMoney } from "../domain/format"
import type { Invoice } from "../domain/invoice"
import { invoiceBadge } from "../domain/lifecycle"
import { calculateInvoiceTotals } from "../domain/totals"
import { StatusBadge } from "./status-badge"

const snapshotName = (invoice: Invoice) =>
  invoice.clientSnapshot?.company || invoice.clientSnapshot?.name || ""

const shownAmount = (invoice: Invoice) => {
  const totals = calculateInvoiceTotals(invoice)
  return invoice.status === "paid" ? totals.total : totals.amountDue
}

const WITH_CLIENT =
  "@3xl:grid-cols-[9rem_minmax(0,1fr)_7.5rem_7.5rem_8rem_7.5rem]"
const WITHOUT_CLIENT =
  "@3xl:grid-cols-[9rem_7.5rem_7.5rem_minmax(0,1fr)_7.5rem]"

export function InvoiceList({
  invoices,
  hrefFor,
  now,
  emptyMessage,
  clientName,
  showClient = true,
}: {
  invoices: readonly Invoice[]
  hrefFor: (invoice: Invoice) => string
  now: Date
  emptyMessage: string
  clientName?: (invoice: Invoice) => string
  showClient?: boolean
}) {
  if (invoices.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>
  }

  const columns = showClient ? WITH_CLIENT : WITHOUT_CLIENT

  return (
    <div className="@container">
      <div className={cn("hidden gap-4 pb-2 text-meta @3xl:grid", columns)}>
        <span>Number</span>
        {showClient ? <span>Client</span> : null}
        <span>Issued</span>
        <span>Due</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Status</span>
      </div>
      <ul className="rule-list">
        {invoices.map((invoice) => {
          const amount = formatMoney(shownAmount(invoice), invoice.currency)
          const client =
            snapshotName(invoice) || clientName?.(invoice) || "No client"
          return (
            <li key={invoice.id}>
              <Link
                href={hrefFor(invoice)}
                className={cn(
                  "-mx-3 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 rounded-field px-3 py-4 transition-colors hover:bg-foreground/5 @3xl:items-center",
                  columns
                )}
              >
                <span className="font-medium">{invoice.number ?? "Draft"}</span>
                <span className="justify-self-end @3xl:order-last">
                  <StatusBadge status={invoiceBadge(invoice, now)} />
                </span>
                {showClient ? (
                  <span className="truncate text-sm text-muted-foreground @3xl:text-base @3xl:text-foreground">
                    {client}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "justify-self-end font-medium tabular-nums @3xl:hidden",
                    !showClient && "col-start-2 row-start-2"
                  )}
                >
                  {amount}
                </span>
                <span className="hidden text-sm text-muted-foreground @3xl:block">
                  {invoice.issueDate ? formatDate(invoice.issueDate) : "—"}
                </span>
                <span
                  className={cn(
                    "text-sm text-muted-foreground @3xl:col-span-1",
                    showClient ? "col-span-2" : "col-start-1 row-start-2"
                  )}
                >
                  {invoice.dueDate ? (
                    <>
                      <span className="@3xl:hidden">Due </span>
                      {formatDate(invoice.dueDate)}
                    </>
                  ) : (
                    "Not sent yet"
                  )}
                </span>
                <span className="hidden text-right font-medium tabular-nums @3xl:block">
                  {amount}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
