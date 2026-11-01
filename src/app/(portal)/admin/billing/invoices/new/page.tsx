import type { Metadata } from "next"
import Link from "next/link"
import { createDraftAction } from "@/features/billing/server/actions"
import { billing } from "@/features/billing/server/billing"

import { Button } from "@/components/ui/button"
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
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            Add a client before creating an invoice.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/billing/clients/new">Add client</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {clients.map((client) => (
            <li key={client.id}>
              <form action={createDraftAction.bind(null, client.id)}>
                <button
                  type="submit"
                  className="w-full rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
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
