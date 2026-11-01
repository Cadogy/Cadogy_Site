import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { draftFromInvoice } from "@/features/billing/components/editor-model"
import { InvoiceActions } from "@/features/billing/components/invoice-actions"
import { InvoiceDocument } from "@/features/billing/components/invoice-document"
import { InvoiceEditor } from "@/features/billing/components/invoice-editor"
import { formatDate } from "@/features/billing/domain/format"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import { calculateInvoiceTotals } from "@/features/billing/domain/totals"
import { billing } from "@/features/billing/server/billing"

import { absoluteUrl } from "@/config/site"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Invoice" }

type Props = { params: Promise<{ id: string }> }

const EVENT_LABELS: Record<string, string> = {
  created: "Draft created",
  updated: "Draft updated",
  issued: "Issued",
  sent: "Emailed to client",
  viewed: "Viewed by client",
  reminder_sent: "Reminder sent",
  payment_recorded: "Payment recorded",
  paid: "Paid in full",
  voided: "Voided",
  marked_uncollectible: "Marked uncollectible",
}

export default async function AdminInvoicePage({ params }: Props) {
  const { id } = await params
  const invoice = await billing.getInvoice(id)
  if (!invoice) notFound()
  const client = await billing.getClient(invoice.clientId)

  if (invoice.status === "draft") {
    const clients = await billing.listClients({ includeArchived: false })
    return (
      <>
        <PortalPageHeader
          title="Draft invoice"
          description="Drafts can be edited freely. Issuing assigns a number and emails the client."
        />
        <InvoiceEditor
          invoiceId={invoice.id}
          initial={draftFromInvoice(invoice)}
          clients={clients.map((option) => ({
            id: option.id,
            label: option.company
              ? `${option.company} — ${option.name}`
              : option.name,
          }))}
        />
      </>
    )
  }

  const snapshot = invoice.clientSnapshot
  if (!snapshot) notFound()
  const amountDue = (calculateInvoiceTotals(invoice).amountDue / 100).toFixed(2)

  return (
    <>
      <PortalPageHeader
        title={`Invoice ${invoice.number}`}
        description={client ? `${client.company || client.name}` : undefined}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <InvoiceDocument
          invoice={invoice}
          client={snapshot}
          status={displayStatus(invoice, new Date())}
        />
        <div className="grid content-start gap-6">
          <InvoiceActions
            invoiceId={invoice.id}
            status={invoice.status}
            publicUrl={absoluteUrl(`/invoice/${invoice.publicToken}`)}
            amountDue={amountDue}
          />
          <section
            aria-labelledby="history-title"
            className="print-hidden rounded-xl border bg-card p-5"
          >
            <h2 id="history-title" className="font-semibold">
              History
            </h2>
            <ol className="mt-3 grid gap-3 text-sm">
              {[...invoice.events].reverse().map((event, index) => (
                <li
                  key={`${event.type}-${event.at.toISOString()}-${index}`}
                  className="flex justify-between gap-3"
                >
                  <span>{EVENT_LABELS[event.type] ?? event.type}</span>
                  <time
                    dateTime={event.at.toISOString()}
                    className="shrink-0 text-muted-foreground"
                  >
                    {formatDate(event.at)}
                  </time>
                </li>
              ))}
            </ol>
          </section>
          {invoice.internalNotes ? (
            <section className="print-hidden rounded-xl border bg-card p-5 text-sm">
              <h2 className="font-semibold">Internal notes</h2>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">
                {invoice.internalNotes}
              </p>
            </section>
          ) : null}
          {client ? (
            <Link
              href={`/admin/billing/clients/${client.id}`}
              className="print-hidden text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              View client
            </Link>
          ) : null}
        </div>
      </div>
    </>
  )
}
