import type { Metadata } from "next"
import Link from "next/link"
import { billing } from "@/features/billing/server/billing"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Clients" }

type Props = { searchParams: Promise<{ archived?: string }> }

export default async function ClientsPage({ searchParams }: Props) {
  const showArchived = (await searchParams).archived === "1"
  const clients = await billing.listClients({ includeArchived: showArchived })

  return (
    <>
      <PortalPageHeader
        title="Clients"
        description="Billing contacts and their defaults."
        actions={
          <Button asChild>
            <Link href="/admin/billing/clients/new">Add client</Link>
          </Button>
        }
      />
      <Link
        href={
          showArchived
            ? "/admin/billing/clients"
            : "/admin/billing/clients?archived=1"
        }
        className="mb-4 inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {showArchived ? "Hide archived clients" : "Show archived clients"}
      </Link>
      {clients.length === 0 ? (
        <EmptyState
          action={
            <Button asChild variant="outline">
              <Link href="/admin/billing/clients/new">Add client</Link>
            </Button>
          }
        >
          No clients yet.
        </EmptyState>
      ) : (
        <ul className="rule-list">
          {clients.map((client) => (
            <li key={client.id}>
              <Link
                href={`/admin/billing/clients/${client.id}`}
                className={cn(
                  "-mx-3 flex flex-col gap-1 rounded-field px-3 py-4 transition-colors hover:bg-foreground/5 sm:flex-row sm:items-center sm:justify-between",
                  client.archivedAt && "opacity-60"
                )}
              >
                <span>
                  <span className="block font-medium">
                    {client.company || client.name}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {client.company ? `${client.name} · ` : ""}
                    {client.email}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {client.currency} · Net {client.defaultTermsDays}
                  {client.archivedAt ? " · Archived" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
