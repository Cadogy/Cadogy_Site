import type { Metadata } from "next"
import Link from "next/link"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { formatAmountsByCurrency } from "@/features/billing/domain/format"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import type { Currency } from "@/features/billing/domain/schema"
import { calculateInvoiceTotals } from "@/features/billing/domain/totals"
import { billing } from "@/features/billing/server/billing"

import { requireSession } from "@/features/auth/server/session"
import { Button } from "@/components/ui/button"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Overview" }

export default async function DashboardPage() {
  const user = await requireSession()
  const invoices = await billing.listForPortalUser(user.email)
  const now = new Date()

  const outstanding = invoices
    .filter((invoice) => invoice.status === "open")
    .reduce<Partial<Record<Currency, number>>>(
      (totals, invoice) => ({
        ...totals,
        [invoice.currency]:
          (totals[invoice.currency] ?? 0) +
          calculateInvoiceTotals(invoice).amountDue,
      }),
      {}
    )
  const overdueCount = invoices.filter(
    (invoice) => displayStatus(invoice, now) === "overdue"
  ).length

  return (
    <>
      <PortalPageHeader
        title={
          user.name
            ? `Welcome back, ${user.name.split(" ")[0]}`
            : "Welcome back"
        }
        description="Your invoices and support requests in one place."
      />
      <dl className="mb-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Outstanding balance</dt>
          <dd className="mt-1 text-xl font-semibold">
            {formatAmountsByCurrency(outstanding)}
          </dd>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Overdue invoices</dt>
          <dd className="mt-1 text-xl font-semibold">{overdueCount}</dd>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Need help?</dt>
          <dd>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/tickets/new">Open a support request</Link>
            </Button>
          </dd>
        </div>
      </dl>
      <section aria-labelledby="recent-invoices">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-invoices" className="font-semibold">
            Recent invoices
          </h2>
          <Link
            href="/dashboard/billing"
            className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <InvoiceList
          invoices={invoices.slice(0, 5)}
          now={now}
          hrefFor={(invoice) => `/invoice/${invoice.publicToken}`}
          emptyMessage={`No invoices yet. Invoices sent to ${user.email} will appear here.`}
        />
      </section>
    </>
  )
}
