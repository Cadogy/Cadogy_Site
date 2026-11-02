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
import { EmptyState } from "@/components/ui/empty-state"
import {
  PortalSection,
  SectionLink,
  StatList,
} from "@/components/portal/portal-section"
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
      <StatList
        stats={[
          {
            label: "Outstanding",
            value: formatAmountsByCurrency(summary.outstanding),
          },
          { label: "Overdue", value: formatAmountsByCurrency(summary.overdue) },
          {
            label: "Paid, last 30 days",
            value: formatAmountsByCurrency(summary.paidLast30Days),
          },
          {
            label: "Monthly recurring revenue",
            value: formatAmountsByCurrency(mrr),
          },
        ]}
      />

      {lastRun ? (
        <p className="mt-6 text-sm text-muted-foreground">
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

      <div className="mt-12 grid gap-x-12 gap-y-12 xl:grid-cols-[1.5fr_1fr]">
        <PortalSection
          title="Needs attention"
          actions={
            <SectionLink href="/admin/billing/invoices?status=overdue">
              All overdue
            </SectionLink>
          }
        >
          <InvoiceList
            invoices={overdue.slice(0, 6)}
            now={now}
            hrefFor={(invoice) => `/admin/billing/invoices/${invoice.id}`}
            emptyMessage="Nothing overdue."
          />
        </PortalSection>
        <PortalSection
          title="Renewing in the next 14 days"
          className="xl:order-last"
          actions={
            <SectionLink href="/admin/billing/catalog">Services</SectionLink>
          }
        >
          {renewals.length === 0 ? (
            <EmptyState>No renewals coming up.</EmptyState>
          ) : (
            <ul className="rule-list">
              {renewals.slice(0, 8).map((addOn) => (
                <li key={addOn.id}>
                  <Link
                    href={`/admin/billing/clients/${addOn.clientId}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 py-3 transition-colors hover:text-foreground"
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
        </PortalSection>
        <PortalSection
          title="New inquiries"
          actions={
            <SectionLink href="/admin/inquiries">All inquiries</SectionLink>
          }
        >
          {inquiries.length === 0 ? (
            <EmptyState>No new inquiries.</EmptyState>
          ) : (
            <ul className="rule-list">
              {inquiries.slice(0, 6).map((inquiry) => (
                <li key={inquiry.id} className="py-3">
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
        </PortalSection>
      </div>
    </>
  )
}
