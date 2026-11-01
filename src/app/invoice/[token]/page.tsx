import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { InvoiceDocument } from "@/features/billing/components/invoice-document"
import { PayInvoicePanel } from "@/features/billing/components/pay-invoice-panel"
import { formatDate, formatMoney } from "@/features/billing/domain/format"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import { calculateInvoiceTotals } from "@/features/billing/domain/totals"
import { billing } from "@/features/billing/server/billing"
import { isStripeConfigured } from "@/features/billing/server/stripe"

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
  const now = new Date()
  const status = displayStatus(invoice, now)
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
          status={status}
        />
        <PayInvoicePanel
          token={token}
          payable={payable}
          onlinePaymentAvailable={isStripeConfigured()}
          amountDueLabel={formatMoney(amountDue, invoice.currency)}
          dueLabel={invoice.dueDate ? formatDate(invoice.dueDate) : null}
          status={status}
          paymentReturned={payment === "success"}
        />
      </main>
    </div>
  )
}
