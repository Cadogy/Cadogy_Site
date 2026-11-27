import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission } from "@/features/auth/server/session"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { formatAmountsByCurrency } from "@/features/billing/domain/format"
import type { Invoice } from "@/features/billing/domain/invoice"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import { billing } from "@/features/billing/server/billing"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterTabs, StatList } from "@/components/portal/portal-section"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Invoices" }

const FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "uncollectible", label: "Uncollectible" },
  { value: "void", label: "Void" },
] as const

const PAGE_SIZE = 50

type Props = {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}

const hrefWith = (params: { status: string; q: string; page?: number }) => {
  const query = new URLSearchParams()
  if (params.status !== "all") query.set("status", params.status)
  if (params.q) query.set("q", params.q)
  if (params.page && params.page > 1) query.set("page", String(params.page))
  const search = query.toString()
  return search
    ? `/admin/billing/invoices?${search}`
    : "/admin/billing/invoices"
}

export default async function AdminInvoicesPage({ searchParams }: Props) {
  await requirePermission("billing:read")
  const { status = "all", q: rawQuery = "", page: rawPage } = await searchParams
  const q = rawQuery.trim()
  const now = new Date()
  const [invoices, summary, clients] = await Promise.all([
    billing.listInvoices({}),
    billing.summary(),
    billing.listClients({ includeArchived: true }),
  ])
  const clientsById = new Map(clients.map((client) => [client.id, client]))
  const names = new Map(
    clients.map((client) => [client.id, client.company || client.name])
  )

  // Search by invoice number, or any name or email on the invoice or client.
  const needle = q.toLowerCase()
  const searchable = (invoice: Invoice) => {
    const client = clientsById.get(invoice.clientId)
    return [
      invoice.number,
      invoice.clientSnapshot?.name,
      invoice.clientSnapshot?.company,
      invoice.clientSnapshot?.email,
      client?.name,
      client?.company,
      client?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
  }
  const searched = needle
    ? invoices.filter((invoice) => searchable(invoice).includes(needle))
    : invoices
  const matching = (value: string) =>
    value === "all"
      ? searched
      : searched.filter((invoice) => displayStatus(invoice, now) === value)
  const filtered = matching(status)
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(pages, Math.max(1, Number(rawPage) || 1))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
        <form
          role="search"
          action="/admin/billing/invoices"
          className="mb-6 flex max-w-md gap-2"
        >
          {status !== "all" ? (
            <input type="hidden" name="status" value={status} />
          ) : null}
          <label htmlFor="invoice-search" className="sr-only">
            Search invoices
          </label>
          <Input
            id="invoice-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Number, client or email"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
        <FilterTabs
          label="Filter invoices"
          items={FILTERS.map((filter) => ({
            label: filter.label,
            href: hrefWith({ status: filter.value, q }),
            active: status === filter.value,
            count: matching(filter.value).length,
          }))}
        />
        <InvoiceList
          invoices={visible}
          now={now}
          hrefFor={(invoice) => `/admin/billing/invoices/${invoice.id}`}
          clientName={(invoice) => names.get(invoice.clientId) ?? ""}
          emptyMessage={
            q ? `No invoices match “${q}”.` : "No invoices here yet."
          }
        />
        {pages > 1 ? (
          <nav
            aria-label="Invoice pages"
            className="mt-6 flex items-center justify-between gap-4 text-sm"
          >
            {page > 1 ? (
              <Link
                href={hrefWith({ status, q, page: page - 1 })}
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link
                href={hrefWith({ status, q, page: page + 1 })}
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
              >
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </>
  )
}
