import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission } from "@/features/auth/server/session"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import {
  clientDisplayName,
  formatAmountsByCurrency,
  formatDate,
  formatMoney,
} from "@/features/billing/domain/format"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import { billing, billingEngine } from "@/features/billing/server/billing"
import { labelFor, PROJECT_TYPES } from "@/features/contact/domain/schema"
import { listInquiries } from "@/features/contact/server/admin"
import { needsStaffReply } from "@/features/support/application/support-service"
import { support } from "@/features/support/server/support"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { TextLink } from "@/components/ui/text-link"
import { PortalHero } from "@/components/portal/portal-hero"
import { PortalSection, StatList } from "@/components/portal/portal-section"

export const metadata: Metadata = { title: "Overview" }

const SHOWN = 6

const todayLabel = (now: Date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now)

type InboxItem = {
  readonly key: string
  readonly href: string
  readonly title: string
  readonly detail: string
  readonly at: Date
}

function Inbox({ items }: { items: readonly InboxItem[] }) {
  if (items.length === 0) return <EmptyState>Inbox zero. Nice.</EmptyState>
  return (
    <ul className="rule-list">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="-mx-3 grid gap-0.5 rounded-field px-3 py-3 transition-colors hover:bg-foreground/5"
          >
            <span className="truncate font-medium">{item.title}</span>
            <span className="text-sm text-muted-foreground">
              {item.detail} · {formatDate(item.at)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function AdminOverviewPage() {
  const user = await requirePermission("billing:read", "/admin")
  const now = new Date()
  const [
    summary,
    invoices,
    inquiries,
    tickets,
    mrr,
    renewals,
    lastRun,
    clients,
  ] = await Promise.all([
    billing.summary(),
    billing.listInvoices({}),
    listInquiries("new"),
    support.listAll(),
    billingEngine.monthlyRecurringRevenue(),
    billingEngine.upcomingRenewals(14),
    billingEngine.lastRun(),
    billing.listClients({ includeArchived: true }),
  ])
  const names = new Map(
    clients.map((client) => [client.id, clientDisplayName(client)])
  )
  const clientName = (id: string) => names.get(id) ?? "Unknown client"
  const attention = [
    ...invoices.filter((invoice) => displayStatus(invoice, now) === "overdue"),
    ...invoices.filter((invoice) => invoice.status === "draft"),
  ]
  const inbox: InboxItem[] = [
    ...inquiries.map((inquiry) => ({
      key: `inquiry-${inquiry.id}`,
      href: "/admin/inquiries",
      title: inquiry.company || inquiry.name,
      detail: `New inquiry · ${labelFor(PROJECT_TYPES, inquiry.projectType)}`,
      at: inquiry.createdAt,
    })),
    ...tickets.filter(needsStaffReply).map((ticket) => ({
      key: `ticket-${ticket.id}`,
      href: `/admin/tickets/${ticket.id}`,
      title: ticket.subject,
      detail: "Ticket needs a reply",
      at: ticket.lastReplyAt,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime())
  const firstName = user.name ? user.name.split(" ")[0] : ""

  return (
    <>
      <PortalHero
        meta={todayLabel(now)}
        title={firstName ? `Hi, ${firstName}` : "Overview"}
        description={
          attention.length + inbox.length === 0
            ? "Nothing needs you right now."
            : `${attention.length} ${attention.length === 1 ? "invoice needs" : "invoices need"} attention and ${inbox.length} ${inbox.length === 1 ? "item is" : "items are"} in the inbox.`
        }
        actions={
          <>
            <Button asChild>
              <Link href="/admin/billing/invoices/new">New invoice</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/billing/clients/new">New client</Link>
            </Button>
          </>
        }
      >
        <StatList
          size="large"
          stats={[
            {
              label: "Outstanding",
              value: formatAmountsByCurrency(summary.outstanding),
              detail: `${summary.openCount} open`,
            },
            {
              label: "Overdue",
              value: formatAmountsByCurrency(summary.overdue),
              detail:
                summary.overdueCount > 0 ? (
                  <span className="text-warning">
                    {summary.overdueCount} overdue
                  </span>
                ) : (
                  "None overdue"
                ),
            },
            {
              label: "Paid, last 30 days",
              value: formatAmountsByCurrency(summary.paidLast30Days),
            },
            {
              label: "Monthly recurring",
              value: formatAmountsByCurrency(mrr),
            },
          ]}
        />
      </PortalHero>

      <div className="grid gap-x-12 gap-y-12 xl:grid-cols-[1.6fr_1fr]">
        <div className="stack-sections">
          <PortalSection
            title="Needs attention"
            description="Overdue invoices first, then drafts waiting to be sent."
            actions={
              <TextLink href="/admin/billing/invoices">All invoices</TextLink>
            }
          >
            <InvoiceList
              invoices={attention.slice(0, SHOWN)}
              now={now}
              hrefFor={(invoice) => `/admin/billing/invoices/${invoice.id}`}
              clientName={(invoice) => clientName(invoice.clientId)}
              emptyMessage="Nothing overdue and no drafts waiting."
            />
          </PortalSection>
          <PortalSection
            title="Renewing in the next 14 days"
            actions={
              <TextLink href="/admin/billing/catalog">Services</TextLink>
            }
          >
            {renewals.length === 0 ? (
              <EmptyState>No renewals coming up.</EmptyState>
            ) : (
              <ul className="rule-list">
                {renewals.slice(0, SHOWN).map((addOn) => (
                  <li key={addOn.id}>
                    <Link
                      href={`/admin/billing/clients/${addOn.clientId}`}
                      className="-mx-3 flex flex-wrap items-baseline justify-between gap-x-4 rounded-field px-3 py-3 transition-colors hover:bg-foreground/5"
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
        </div>
        <div className="stack-sections">
          <PortalSection
            title="Inbox"
            actions={<TextLink href="/admin/tickets">Tickets</TextLink>}
          >
            <Inbox items={inbox.slice(0, SHOWN)} />
          </PortalSection>
          {lastRun ? (
            <PortalSection title="Last billing run">
              <p className="text-sm text-muted-foreground">
                {formatDate(lastRun.at)}: {lastRun.invoicesIssued} invoices
                issued, {lastRun.autopayCollected} paid by autopay
                {lastRun.autopayFailed > 0 ? (
                  <span className="text-warning">
                    , {lastRun.autopayFailed} autopay failed (clients were
                    emailed)
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
            </PortalSection>
          ) : null}
        </div>
      </div>
    </>
  )
}
