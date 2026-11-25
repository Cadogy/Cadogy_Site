import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePermission } from "@/features/auth/server/session"
import { CreditNoteForm } from "@/features/billing/components/credit-note-form"
import { draftFromInvoice } from "@/features/billing/components/editor-model"
import { InvoiceActions } from "@/features/billing/components/invoice-actions"
import { InvoiceDocument } from "@/features/billing/components/invoice-document"
import { InvoiceEditor } from "@/features/billing/components/invoice-editor"
import { refundableAmount } from "@/features/billing/domain/credits"
import {
  clientDisplayName,
  formatDate,
  formatMoney,
  INVOICE_EVENT_LABELS,
  toMoneyInput,
} from "@/features/billing/domain/format"
import { invoicePublicPath } from "@/features/billing/domain/invoice"
import { invoiceBadge } from "@/features/billing/domain/lifecycle"
import { calculateInvoiceTotals } from "@/features/billing/domain/totals"
import { billing, credits } from "@/features/billing/server/billing"
import { adjustInvoiceAction } from "@/features/billing/server/credit-actions"

import { absoluteUrl } from "@/config/site"
import { PortalSection } from "@/components/portal/portal-section"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Invoice" }

type Props = { params: Promise<{ id: string }> }

const asInput = (amount: number) => (amount > 0 ? toMoneyInput(amount) : null)

export default async function AdminInvoicePage({ params }: Props) {
  await requirePermission("billing:read")
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
  const owed = calculateInvoiceTotals(invoice).amountDue
  const amountDue = toMoneyInput(owed)
  const refundable = refundableAmount(invoice)
  const issued = invoice.status !== "void"
  const balance =
    invoice.status === "open" && owed > 0
      ? await credits.balanceFor(invoice.clientId, invoice.currency)
      : 0

  return (
    <>
      <PortalPageHeader
        title={`Invoice ${invoice.number}`}
        description={client ? clientDisplayName(client) : undefined}
      />
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <InvoiceDocument
          invoice={invoice}
          client={snapshot}
          status={invoiceBadge(invoice, new Date())}
          headingLevel={2}
        />
        <div className="grid content-start gap-10">
          <InvoiceActions
            invoiceId={invoice.id}
            status={invoice.status}
            publicUrl={absoluteUrl(invoicePublicPath(invoice.publicToken))}
            amountDue={amountDue}
            creditBalance={
              balance > 0 ? formatMoney(balance, invoice.currency) : null
            }
          />
          {issued && (refundable > 0 || owed > 0) ? (
            <PortalSection title="Refund or credit" className="print-hidden">
              <CreditNoteForm
                refundable={asInput(refundable)}
                owed={invoice.status === "open" ? asInput(owed) : null}
                onSubmit={adjustInvoiceAction.bind(null, invoice.id)}
              />
            </PortalSection>
          ) : null}
          <PortalSection title="History" className="print-hidden">
            <ol className="grid gap-3 text-sm">
              {[...invoice.events].reverse().map((event, index) => (
                <li
                  key={`${event.type}-${event.at.toISOString()}-${index}`}
                  className="flex justify-between gap-3"
                >
                  <span>{INVOICE_EVENT_LABELS[event.type]}</span>
                  <time
                    dateTime={event.at.toISOString()}
                    className="shrink-0 text-muted-foreground"
                  >
                    {formatDate(event.at)}
                  </time>
                </li>
              ))}
            </ol>
          </PortalSection>
          {invoice.internalNotes ? (
            <PortalSection title="Internal notes" className="print-hidden">
              <p className="text-sm whitespace-pre-line text-muted-foreground">
                {invoice.internalNotes}
              </p>
            </PortalSection>
          ) : null}
          {client ? (
            <Link
              href={`/admin/billing/clients/${client.id}`}
              className="print-hidden inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              View client
            </Link>
          ) : null}
        </div>
      </div>
    </>
  )
}
