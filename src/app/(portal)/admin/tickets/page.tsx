import type { Metadata } from "next"
import Link from "next/link"
import {
  TICKET_STATUSES,
  type TicketStatus,
} from "@/features/support/application/support-service"
import { TicketList } from "@/features/support/components/ticket-list"
import { support } from "@/features/support/server/support"

import { cn } from "@/lib/utils"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Tickets" }

type Props = { searchParams: Promise<{ status?: string }> }

const isStatus = (value: string | undefined): value is TicketStatus =>
  TICKET_STATUSES.some((status) => status === value)

export default async function AdminTicketsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const filter = isStatus(status) ? status : undefined
  const tickets = await support.listAll(filter)

  return (
    <>
      <PortalPageHeader
        title="Tickets"
        description="Client support requests."
      />
      <nav
        aria-label="Filter tickets"
        className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1"
      >
        {[undefined, ...TICKET_STATUSES].map((value) => (
          <Link
            key={value ?? "all"}
            href={value ? `/admin/tickets?status=${value}` : "/admin/tickets"}
            aria-current={filter === value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium capitalize",
              filter === value
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {value ? value.replace("-", " ") : "All"}
          </Link>
        ))}
      </nav>
      <TicketList
        tickets={tickets}
        basePath="/admin/tickets"
        viewer="admin"
        emptyMessage="No tickets here."
      />
    </>
  )
}
