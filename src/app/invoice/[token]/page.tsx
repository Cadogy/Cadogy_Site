import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { optionalSessionUser } from "@/features/auth/server/session"
import {
  InvoiceAccountPrompt,
  type InvoiceAccountState,
} from "@/features/billing/components/invoice-account-prompt"
import { InvoiceDocument } from "@/features/billing/components/invoice-document"
import { PayInvoicePanel } from "@/features/billing/components/pay-invoice-panel"
import { formatDate, formatMoney } from "@/features/billing/domain/format"
import {
  displayStatus,
  invoiceBadge,
} from "@/features/billing/domain/lifecycle"
import { calculateInvoiceTotals } from "@/features/billing/domain/totals"
import { billing } from "@/features/billing/server/billing"
import { isStripeConfigured } from "@/features/billing/server/stripe"
import { requestInvoiceAccessAction } from "@/features/billing/server/team-actions"

import { siteConfig } from "@/config/site"
import { Logo } from "@/components/site/logo"

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false, nocache: true },
}

type Props = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ payment?: string }>
}

export default async function HostedInvoicePage({
  params,
  searchParams,
}: Props) {
  const [{ token }, { payment }] = await Promise.all([params, searchParams])
  const found = await billing.getByPublicToken(token)
  if (!found?.clientSnapshot) notFound()

  const invoice = await billing.markViewed(found)
  const viewer = await optionalSessionUser()
  const accountState: InvoiceAccountState = !viewer
    ? "guest"
    : (await billing.portalRoleFor(viewer.email, invoice.clientId))
      ? "member"
      : "outsider"
  const now = new Date()
  const status = displayStatus(invoice, now)
  const badge = invoiceBadge(invoice, now)
  const { amountDue } = calculateInvoiceTotals(invoice)
  const payable =
    (invoice.status === "open" || invoice.status === "uncollectible") &&
    amountDue > 0

  return (
    <div className="paper min-h-dvh">
      <header className="print-hidden container-page flex h-16 items-center justify-between">
        <Logo />
        <a
          href={`mailto:${siteConfig.email}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Questions? {siteConfig.email}
        </a>
      </header>
      <main
        id="main"
        className="container-page grid gap-6 pb-16 lg:grid-cols-[1fr_300px] lg:items-start"
      >
        <InvoiceDocument
          invoice={invoice}
          client={found.clientSnapshot}
          status={badge}
        />
        <div className="grid content-start gap-6 lg:sticky lg:top-6">
          <PayInvoicePanel
            token={token}
            payable={payable}
            onlinePaymentAvailable={isStripeConfigured()}
            amountDueLabel={formatMoney(amountDue, invoice.currency)}
            dueLabel={invoice.dueDate ? formatDate(invoice.dueDate) : null}
            status={status}
            badge={badge}
            paymentReturned={payment === "success"}
          />
          <InvoiceAccountPrompt
            state={accountState}
            invoicePath={`/invoice/${token}`}
            onRequest={requestInvoiceAccessAction.bind(null, token)}
          />
        </div>
      </main>
    </div>
  )
}
