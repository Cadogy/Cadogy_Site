import type { Metadata } from "next"
import Link from "next/link"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { formatAmountsByCurrency } from "@/features/billing/domain/format"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import { billing } from "@/features/billing/server/billing"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Invoices" }

const FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
] as const

type Props = { searchParams: Promise<{ status?: string }> }

export default async function AdminInvoicesPage({ searchParams }: Props) {
  const { status = "all" } = await searchParams
  const now = new Date()
  const [invoices, summary] = await Promise.all([
    billing.listInvoices({}),
    billing.summary(),
  ])
  const visible =
    status === "all"
      ? invoices
      : invoices.filter((invoice) => displayStatus(invoice, now) === status)

  const kpis = [
    {
      label: "Outstanding",
      value: formatAmountsByCurrency(summary.outstanding),
      detail: `${summary.openCount} open`,
    },
    {
      label: "Overdue",
      value: formatAmountsByCurrency(summary.overdue),
      detail: `${summary.overdueCount} overdue`,
    },
    {
      label: "Paid in the last 30 days",
      value: formatAmountsByCurrency(summary.paidLast30Days),
      detail: "All methods",
    },
  ]

  return (
    <>
      <PortalPageHeader
        title="Invoices"
        description="Create, send and track invoices."
        actions={
          <Button asChild>
            <Link href="/admin/billing/invoices/new">New invoice</Link>
          </Button>
        }
      />
      <dl className="mb-8 grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{kpi.label}</dt>
            <dd className="mt-1 text-xl font-semibold">{kpi.value}</dd>
            <dd className="mt-1 text-sm text-muted-foreground">{kpi.detail}</dd>
          </div>
        ))}
      </dl>
      <nav
        aria-label="Filter invoices"
        className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1"
      >
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={
              filter.value === "all"
                ? "/admin/billing/invoices"
                : `/admin/billing/invoices?status=${filter.value}`
            }
            aria-current={status === filter.value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium",
              status === filter.value
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>
      <InvoiceList
        invoices={visible}
        now={now}
        hrefFor={(invoice) => `/admin/billing/invoices/${invoice.id}`}
        emptyMessage="No invoices here yet."
      />
    </>
  )
}
