import type { Metadata } from "next"
import { requireSession } from "@/features/auth/server/session"
import { ActionButton } from "@/features/billing/components/action-controls"
import { CreditNoteList } from "@/features/billing/components/credit-note-list"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { PayBalance } from "@/features/billing/components/pay-balance"
import {
  formatDate,
  formatMoney,
  intervalLabel,
} from "@/features/billing/domain/format"
import { displayStatus } from "@/features/billing/domain/lifecycle"
import { calculateInvoiceTotals } from "@/features/billing/domain/totals"
import {
  billing,
  billingEngine,
  credits,
} from "@/features/billing/server/billing"
import {
  payInvoicesAction,
  removePortalCardAction,
  saveCardForAutopayAction,
  setPortalAutopayAction,
} from "@/features/billing/server/engine-actions"
import { isStripeConfigured } from "@/features/billing/server/stripe"

import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Billing" }

type Props = { searchParams: Promise<{ payment?: string; card?: string }> }

export default async function ClientBillingPage({ searchParams }: Props) {
  const user = await requireSession("/dashboard/billing")
  const { payment, card } = await searchParams
  const now = new Date()
  const [invoices, accounts] = await Promise.all([
    billing.listForPortalUser(user.email),
    billing.clientsForPortalUser(user.email),
  ])
  const services = (
    await Promise.all(
      accounts.map((account) => billingEngine.listAddOns(account.id))
    )
  )
    .flat()
    .filter((addOn) => addOn.status === "active")
  const open = invoices.filter((invoice) => invoice.status === "open")
  const [notes, balances] = await Promise.all([
    Promise.all(
      accounts.map((account) => credits.notesFor({ clientId: account.id }))
    ).then((lists) => lists.flat()),
    Promise.all(
      accounts.map(async (account) => ({
        account,
        amount: await credits.balanceFor(account.id, account.currency),
      }))
    ).then((list) => list.filter((balance) => balance.amount > 0)),
  ])
  const tokens = new Map(
    invoices.map((invoice) => [invoice.id, invoice.publicToken])
  )
  const onlinePayment = isStripeConfigured()

  return (
    <>
      <PortalPageHeader
        title="Billing"
        description="Pay invoices, see your services and manage autopay."
      />
      {payment === "success" ? (
        <p
          role="status"
          className="mb-8 border-l-2 border-success pl-4 text-sm"
        >
          Payment received, thank you. It can take a minute to show here, and a
          receipt is on its way.
        </p>
      ) : null}
      {card === "saved" ? (
        <p
          role="status"
          className="mb-8 border-l-2 border-success pl-4 text-sm"
        >
          Card saved. Autopay is on, so renewals are paid automatically and
          you&apos;ll get a receipt each time.
        </p>
      ) : null}

      <div className="grid gap-12">
        <section aria-labelledby="balance-title">
          <h2 id="balance-title" className="mb-4 font-semibold">
            Balance due
          </h2>
          {open.length === 0 ? (
            <p className="border-t py-6 text-muted-foreground">
              You&apos;re all paid up.
            </p>
          ) : (
            <PayBalance
              invoices={open.map((invoice) => ({
                id: invoice.id,
                number: invoice.number ?? "Invoice",
                amountDue: calculateInvoiceTotals(invoice).amountDue,
                currency: invoice.currency,
                dueLabel: invoice.dueDate ? formatDate(invoice.dueDate) : null,
                overdue: displayStatus(invoice, now) === "overdue",
                href: `/invoice/${invoice.publicToken}`,
              }))}
              onPay={payInvoicesAction}
              onlinePaymentAvailable={onlinePayment}
            />
          )}
        </section>

        {services.length > 0 ? (
          <section aria-labelledby="services-title" className="border-t pt-8">
            <h2 id="services-title" className="mb-4 font-semibold">
              Your services
            </h2>
            <ul className="divide-y border-y">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4"
                >
                  <span>
                    <span className="font-medium">
                      {service.name}
                      {service.quantity > 1 ? ` × ${service.quantity}` : ""}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {service.interval === "one_time"
                        ? `Bills ${formatDate(service.nextBillingDate)}`
                        : `Renews ${formatDate(service.nextBillingDate)}`}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(
                      service.unitAmount * service.quantity,
                      service.currency
                    )}{" "}
                    <span className="text-muted-foreground">
                      {intervalLabel(service.interval, "per")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              Need to add or change a service? Open a support request and
              we&apos;ll handle it.
            </p>
          </section>
        ) : null}

        {onlinePayment && accounts.length > 0 ? (
          <section aria-labelledby="autopay-title" className="border-t pt-8">
            <h2 id="autopay-title" className="mb-1 font-semibold">
              Autopay
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Save a card and renewals are paid on the invoice date. You still
              get every invoice and receipt by email, and you can turn it off at
              any time.
            </p>
            <ul className="divide-y border-y">
              {accounts.map((account) => {
                const saved = account.autopay.card
                return (
                  <li
                    key={account.id}
                    className="grid gap-3 py-4 sm:flex sm:items-center sm:justify-between"
                  >
                    <div>
                      {accounts.length > 1 ? (
                        <p className="font-medium">
                          {account.company || account.name}
                        </p>
                      ) : null}
                      <p
                        className={
                          accounts.length > 1
                            ? "text-sm text-muted-foreground"
                            : undefined
                        }
                      >
                        {saved
                          ? `${account.autopay.enabled ? "On" : "Off"} · ${saved.brand} ending ${saved.last4}, expires ${saved.expMonth}/${saved.expYear}`
                          : "No card saved."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {saved ? (
                        <ActionButton
                          action={setPortalAutopayAction.bind(
                            null,
                            account.id,
                            !account.autopay.enabled
                          )}
                        >
                          {account.autopay.enabled
                            ? "Turn off autopay"
                            : "Turn on autopay"}
                        </ActionButton>
                      ) : null}
                      <ActionButton
                        action={saveCardForAutopayAction.bind(null, account.id)}
                        variant={saved ? "ghost" : "outline"}
                      >
                        {saved ? "Replace card" : "Save a card"}
                      </ActionButton>
                      {saved ? (
                        <ActionButton
                          action={removePortalCardAction.bind(null, account.id)}
                          variant="ghost"
                          confirm="Remove your saved card? Autopay will turn off."
                        >
                          Remove card
                        </ActionButton>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        {notes.length > 0 ? (
          <section aria-labelledby="credit-title" className="border-t pt-8">
            <h2 id="credit-title" className="mb-1 font-semibold">
              Credits and refunds
            </h2>
            {balances.map(({ account, amount }) => (
              <p
                key={account.id}
                className="mb-1 text-sm text-muted-foreground"
              >
                {accounts.length > 1
                  ? `${account.company || account.name}: `
                  : ""}
                {formatMoney(amount, account.currency)} of credit, used on your
                next invoice before any card is charged.
              </p>
            ))}
            <div className="mt-4">
              <CreditNoteList
                notes={notes}
                hrefFor={(invoiceId) =>
                  `/invoice/${tokens.get(invoiceId) ?? ""}`
                }
              />
            </div>
          </section>
        ) : null}

        <section aria-labelledby="history-title" className="border-t pt-8">
          <h2 id="history-title" className="mb-4 font-semibold">
            All invoices
          </h2>
          <InvoiceList
            invoices={invoices}
            now={now}
            hrefFor={(invoice) => `/invoice/${invoice.publicToken}`}
            emptyMessage={`No invoices yet. Invoices sent to ${user.email} will appear here.`}
          />
        </section>
      </div>
    </>
  )
}
