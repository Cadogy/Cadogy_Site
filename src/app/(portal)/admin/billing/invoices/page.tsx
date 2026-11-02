import type { Metadata } from "next"
import Link from "next/link"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { formatAmountsByCurrency } from "@/features/billing/domain/format"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import { billing } from "@/features/billing/server/billing"

import { Button } from "@/components/ui/button"
import { FilterTabs, StatList } from "@/components/portal/portal-section"
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
      <StatList stats={kpis} />
      <div className="mt-12">
        <FilterTabs
          label="Filter invoices"
          items={FILTERS.map((filter) => ({
            label: filter.label,
            href:
              filter.value === "all"
                ? "/admin/billing/invoices"
                : `/admin/billing/invoices?status=${filter.value}`,
            active: status === filter.value,
          }))}
        />
        <InvoiceList
          invoices={visible}
          now={now}
          hrefFor={(invoice) => `/admin/billing/invoices/${invoice.id}`}
          emptyMessage="No invoices here yet."
        />
      </div>
    </>
  )
}
