import type { Metadata } from "next"
import Link from "next/link"
import { requireSession } from "@/features/auth/server/session"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { formatAmountsByCurrency } from "@/features/billing/domain/format"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import type { Currency } from "@/features/billing/domain/schema"
import { calculateInvoiceTotals } from "@/features/billing/domain/totals"
import { billing } from "@/features/billing/server/billing"

import { Button } from "@/components/ui/button"
import {
  PortalSection,
  SectionLink,
  StatList,
} from "@/components/portal/portal-section"
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
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/tickets/new">Open a support request</Link>
          </Button>
        }
      />
      <StatList
        stats={[
          {
            label: "Outstanding balance",
            value: formatAmountsByCurrency(outstanding),
          },
          { label: "Overdue invoices", value: overdueCount },
        ]}
      />
      <div className="mt-12 stack-sections">
        <PortalSection
          title="Recent invoices"
          actions={
            <SectionLink href="/dashboard/billing">View all</SectionLink>
          }
        >
          <InvoiceList
            invoices={invoices.slice(0, 5)}
            now={now}
            hrefFor={(invoice) => `/invoice/${invoice.publicToken}`}
            emptyMessage={`No invoices yet. Invoices sent to ${user.email} will appear here.`}
          />
        </PortalSection>
      </div>
    </>
  )
}
