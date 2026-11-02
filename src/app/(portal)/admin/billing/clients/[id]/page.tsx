import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ClientArchiveButton } from "@/features/billing/components/client-archive-button"
import { ClientBilling } from "@/features/billing/components/client-billing"
import { ClientForm } from "@/features/billing/components/client-form"
import { ContactsManager } from "@/features/billing/components/contacts-manager"
import { BalanceCreditForm } from "@/features/billing/components/credit-balance"
import { CreditNoteList } from "@/features/billing/components/credit-note-list"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { formatMoney } from "@/features/billing/domain/format"
import { createDraftAction } from "@/features/billing/server/actions"
import {
  billing,
  billingEngine,
  credits,
} from "@/features/billing/server/billing"
import { creditBalanceAction } from "@/features/billing/server/credit-actions"
import {
  inviteClientContactAction,
  removeClientContactAction,
  setClientContactRoleAction,
} from "@/features/billing/server/team-actions"

import { Button } from "@/components/ui/button"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Client" }

type Props = { params: Promise<{ id: string }> }

export default async function ClientPage({ params }: Props) {
  const { id } = await params
  const client = await billing.getClient(id)
  if (!client) notFound()
  const [invoices, addOns, pending, catalog, notes, balance] =
    await Promise.all([
      billing.listInvoices({ clientIds: [client.id] }),
      billingEngine.listAddOns(client.id),
      billingEngine.pendingCharges(client.id),
      billingEngine.listCatalog({ includeArchived: false }),
      credits.notesFor({ clientId: client.id }),
      credits.balanceFor(client.id, client.currency),
    ])

  return (
    <>
      <PortalPageHeader
        title={client.company || client.name}
        description={client.email}
        actions={
          <>
            {client.archivedAt ? null : (
              <form action={createDraftAction.bind(null, client.id)}>
                <Button type="submit">New invoice</Button>
              </form>
            )}
            <ClientArchiveButton
              clientId={client.id}
              archived={Boolean(client.archivedAt)}
            />
          </>
        }
      />
      <div className="grid gap-10">
        <ClientBilling
          client={client}
          addOns={addOns}
          pending={pending}
          catalog={catalog}
        />
        <section aria-labelledby="client-team" className="border-t pt-8">
          <h2 id="client-team" className="mb-1 font-semibold">
            Team
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Everyone at {client.company || client.name} who can sign in to the
            portal. Billing contacts receive every invoice.
          </p>
          <ContactsManager
            primary={{ email: client.email, name: client.name }}
            contacts={client.contacts}
            canManage
            onInvite={inviteClientContactAction.bind(null, client.id)}
            onRoleChange={setClientContactRoleAction.bind(null, client.id)}
            onRemove={removeClientContactAction.bind(null, client.id)}
          />
        </section>
        <section aria-labelledby="client-credit" className="border-t pt-8">
          <h2 id="client-credit" className="mb-1 font-semibold">
            Credit
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Balance: {formatMoney(balance, client.currency)}. Account credit is
            used on the next invoice before any card is charged.
          </p>
          <BalanceCreditForm
            currency={client.currency}
            onSubmit={creditBalanceAction.bind(null, client.id)}
          />
          <div className="mt-6">
            <CreditNoteList
              notes={notes}
              hrefFor={(invoiceId) => `/admin/billing/invoices/${invoiceId}`}
            />
          </div>
        </section>
        <section aria-labelledby="client-invoices" className="border-t pt-8">
          <h2 id="client-invoices" className="mb-4 font-semibold">
            Invoices
          </h2>
          <InvoiceList
            invoices={invoices}
            now={new Date()}
            hrefFor={(invoice) => `/admin/billing/invoices/${invoice.id}`}
            emptyMessage="No invoices for this client yet."
          />
        </section>
        <section aria-labelledby="client-details" className="border-t pt-8">
          <h2 id="client-details" className="mb-4 font-semibold">
            Details
          </h2>
          <ClientForm client={client} />
        </section>
      </div>
    </>
  )
}
