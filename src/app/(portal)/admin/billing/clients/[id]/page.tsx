import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ClientArchiveButton } from "@/features/billing/components/client-archive-button"
import { ClientBilling } from "@/features/billing/components/client-billing"
import { ContactsManager } from "@/features/billing/components/contacts-manager"
import {
  inviteClientContactAction,
  removeClientContactAction,
  setClientContactRoleAction,
} from "@/features/billing/server/team-actions"
import { ClientForm } from "@/features/billing/components/client-form"
import { InvoiceList } from "@/features/billing/components/invoice-list"
import { createDraftAction } from "@/features/billing/server/actions"
import { billing, billingEngine } from "@/features/billing/server/billing"

import { Button } from "@/components/ui/button"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Client" }

type Props = { params: Promise<{ id: string }> }

export default async function ClientPage({ params }: Props) {
  const { id } = await params
  const client = await billing.getClient(id)
  if (!client) notFound()
  const [invoices, addOns, pending, catalog] = await Promise.all([
    billing.listInvoices({ clientIds: [client.id] }),
    billingEngine.listAddOns(client.id),
    billingEngine.pendingCharges(client.id),
    billingEngine.listCatalog({ includeArchived: false }),
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
