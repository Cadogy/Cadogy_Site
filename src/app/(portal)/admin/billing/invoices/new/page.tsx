import type { Metadata } from "next"
import Link from "next/link"
import { createDraftAction } from "@/features/billing/server/actions"
import { billing } from "@/features/billing/server/billing"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "New invoice" }

export default async function NewInvoicePage() {
  const clients = await billing.listClients({ includeArchived: false })

  return (
    <>
      <PortalPageHeader
        title="New invoice"
        description="Who is this invoice for?"
      />
      {clients.length === 0 ? (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/admin/billing/clients/new">Add client</Link>
            </Button>
          }
        >
          Add a client before creating an invoice.
        </EmptyState>
      ) : (
        <ul className="rule-list">
          {clients.map((client) => (
            <li key={client.id}>
              <form action={createDraftAction.bind(null, client.id)}>
                <button
                  type="submit"
                  className="-mx-3 flex min-h-11 w-[calc(100%+1.5rem)] flex-col rounded-field px-3 py-4 text-left transition-colors hover:bg-foreground/5"
                >
                  <span className="block font-medium">
                    {client.company || client.name}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {client.email}
                  </span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
