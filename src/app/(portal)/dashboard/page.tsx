import type { Metadata } from "next"
import Link from "next/link"
import { requireSession } from "@/features/auth/server/session"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { accountSummary } from "@/features/billing/domain/account-summary"
import {
  clientDisplayName,
  formatAmountsByCurrency,
  formatDate,
  sumByCurrency,
} from "@/features/billing/domain/format"
import { invoicePublicPath } from "@/features/billing/domain/invoice"
import { displayStatus, isPayable } from "@/features/billing/domain/lifecycle"
import { calculateInvoiceTotals } from "@/features/billing/domain/totals"
import { billing } from "@/features/billing/server/billing"
import { TicketList } from "@/features/support/components/ticket-list"
import { support } from "@/features/support/server/support"

import { Button } from "@/components/ui/button"
import { TextLink } from "@/components/ui/text-link"
import { PortalHero } from "@/components/portal/portal-hero"
import { PortalSection, StatList } from "@/components/portal/portal-section"

export const metadata: Metadata = { title: "Dashboard" }

const RECENT = 4

export default async function DashboardPage() {
  const user = await requireSession()
  const now = new Date()
  const [invoices, accounts, tickets] = await Promise.all([
    billing.listForPortalUser(user.email),
    billing.clientsForPortalUser(user.email),
    support.listForUser(user.id),
  ])

  const open = invoices.filter(isPayable)
  const overdue = open.filter(
    (invoice) => displayStatus(invoice, now) === "overdue"
  )
  const paid = invoices.filter((invoice) => invoice.status === "paid")
  const balance = sumByCurrency(
    open.map((invoice) => ({
      currency: invoice.currency,
      amount: calculateInvoiceTotals(invoice).amountDue,
    }))
  )
  const nextDue = open
    .flatMap((invoice) => (invoice.dueDate ? [invoice.dueDate] : []))
    .sort((a, b) => a.getTime() - b.getTime())[0]
  const activeTickets = tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in-progress"
  )
  const firstName = user.name ? user.name.split(" ")[0] : ""
  const companies = accounts.map(clientDisplayName).join(", ")

  return (
    <>
      <PortalHero
        meta={companies || undefined}
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description={accountSummary({
          open: open.length,
          overdue: overdue.length,
        })}
        actions={
          <>
            {open.length > 0 ? (
              <Button asChild>
                <Link href="/dashboard/billing">Pay invoices</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/dashboard/tickets/new">Get support</Link>
            </Button>
          </>
        }
      >
        <StatList
          size="large"
          stats={[
            {
              label: "Balance due",
              value: formatAmountsByCurrency(balance),
              detail:
                overdue.length > 0 ? (
                  <span className="text-warning">{overdue.length} overdue</span>
                ) : undefined,
            },
            {
              label: "Next due",
              value: nextDue ? formatDate(nextDue) : "Nothing due",
            },
            { label: "Open requests", value: activeTickets.length },
          ]}
        />
      </PortalHero>

      <div className="grid gap-x-12 gap-y-12 xl:grid-cols-[1.6fr_1fr]">
        <div className="stack-sections">
          <PortalSection
            title="To pay"
            actions={<TextLink href="/dashboard/billing">Billing</TextLink>}
          >
            <InvoiceList
              invoices={open}
              now={now}
              hrefFor={(invoice) => invoicePublicPath(invoice.publicToken)}
              showClient={false}
              emptyMessage="Nothing to pay right now."
            />
          </PortalSection>
          <PortalSection title="Paid recently">
            <InvoiceList
              invoices={paid.slice(0, RECENT)}
              now={now}
              hrefFor={(invoice) => invoicePublicPath(invoice.publicToken)}
              showClient={false}
              emptyMessage={`No paid invoices yet. Invoices sent to ${user.email} appear here.`}
            />
          </PortalSection>
        </div>
        <div className="stack-sections">
          <PortalSection
            title="Support"
            actions={
              <TextLink href="/dashboard/tickets">All requests</TextLink>
            }
          >
            <TicketList
              tickets={tickets.slice(0, RECENT)}
              basePath="/dashboard/tickets"
              viewer="client"
              emptyMessage="No support requests. Ask us anything about your project or an invoice."
            />
          </PortalSection>
        </div>
      </div>
    </>
  )
}
