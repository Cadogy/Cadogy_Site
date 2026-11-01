import type { Metadata } from "next"
import Link from "next/link"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import {
  formatAmountsByCurrency,
  formatDate,
  formatMoney,
} from "@/features/billing/domain/format"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import { billing, billingEngine } from "@/features/billing/server/billing"
import { labelFor, PROJECT_TYPES } from "@/features/contact/domain/schema"
import { listInquiries } from "@/features/contact/server/admin"

import { Button } from "@/components/ui/button"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Admin" }

export default async function AdminOverviewPage() {
  const now = new Date()
  const [summary, invoices, inquiries, mrr, renewals, lastRun, clients] =
    await Promise.all([
      billing.summary(),
      billing.listInvoices({ status: "open" }),
      listInquiries("new"),
      billingEngine.monthlyRecurringRevenue(),
      billingEngine.upcomingRenewals(14),
      billingEngine.lastRun(),
      billing.listClients({ includeArchived: true }),
    ])
  const clientName = (id: string) => {
    const client = clients.find((candidate) => candidate.id === id)
    return client ? client.company || client.name : "Unknown client"
  }
  const overdue = invoices.filter(
    (invoice) => displayStatus(invoice, now) === "overdue"
  )

  return (
    <>
      <PortalPageHeader
        title="Overview"
        actions={
          <Button asChild>
            <Link href="/admin/billing/invoices/new">New invoice</Link>
          </Button>
        }
      />
      <dl className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Outstanding</dt>
          <dd className="mt-1 text-xl font-semibold">
            {formatAmountsByCurrency(summary.outstanding)}
          </dd>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Overdue</dt>
          <dd className="mt-1 text-xl font-semibold">
            {formatAmountsByCurrency(summary.overdue)}
          </dd>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Paid, last 30 days</dt>
          <dd className="mt-1 text-xl font-semibold">
            {formatAmountsByCurrency(summary.paidLast30Days)}
          </dd>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">
            Monthly recurring revenue
          </dt>
          <dd className="mt-1 text-xl font-semibold">
            {formatAmountsByCurrency(mrr)}
          </dd>
        </div>
      </dl>

      {lastRun ? (
        <p className="-mt-6 mb-10 text-sm text-muted-foreground">
          Last billing run {formatDate(lastRun.at)}: {lastRun.invoicesIssued}{" "}
          invoices issued, {lastRun.autopayCollected} paid by autopay
          {lastRun.autopayFailed > 0 ? (
            <span className="text-warning">
              , {lastRun.autopayFailed} autopay failed (clients were emailed)
            </span>
          ) : null}
          {lastRun.errors.length > 0 ? (
            <Link
              href="/admin/billing/settings"
              className="text-destructive underline underline-offset-4"
            >
              , {lastRun.errors.length} errors
            </Link>
          ) : null}
          .
        </p>
      ) : null}

      <div className="grid gap-10 xl:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="overdue-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="overdue-title" className="font-semibold">
              Needs attention
            </h2>
            <Link
              href="/admin/billing/invoices?status=overdue"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
            >
              All overdue
            </Link>
          </div>
          <InvoiceList
            invoices={overdue.slice(0, 6)}
            now={now}
            hrefFor={(invoice) => `/admin/billing/invoices/${invoice.id}`}
            emptyMessage="Nothing overdue."
          />
        </section>
        <section aria-labelledby="renewals-title" className="xl:order-last">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="renewals-title" className="font-semibold">
              Renewing in the next 14 days
            </h2>
            <Link
              href="/admin/billing/catalog"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
            >
              Services
            </Link>
          </div>
          {renewals.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              No renewals coming up.
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border">
              {renewals.slice(0, 8).map((addOn) => (
                <li key={addOn.id}>
                  <Link
                    href={`/admin/billing/clients/${addOn.clientId}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-3 hover:bg-accent/50"
                  >
                    <span>
                      <span className="font-medium">
                        {clientName(addOn.clientId)}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {addOn.name} · {formatDate(addOn.nextBillingDate)}
                      </span>
                    </span>
                    <span className="tabular-nums">
                      {formatMoney(
                        addOn.unitAmount * addOn.quantity,
                        addOn.currency
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="inquiries-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="inquiries-title" className="font-semibold">
              New inquiries
            </h2>
            <Link
              href="/admin/inquiries"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
            >
              All inquiries
            </Link>
          </div>
          {inquiries.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              No new inquiries.
            </p>
          ) : (
            <ul className="divide-y overflow-hidden rounded-xl border">
              {inquiries.slice(0, 6).map((inquiry) => (
                <li key={inquiry.id} className="px-4 py-3">
                  <p className="font-medium">
                    {inquiry.company || inquiry.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(inquiry.createdAt)} ·{" "}
                    {labelFor(PROJECT_TYPES, inquiry.projectType)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
