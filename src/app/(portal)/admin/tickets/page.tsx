import type { Metadata } from "next"
import {
  TICKET_STATUSES,
  type TicketStatus,
} from "@/features/support/application/support-service"
import { TicketList } from "@/features/support/components/ticket-list"
import { support } from "@/features/support/server/support"

import { FilterTabs } from "@/components/portal/portal-section"
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
      <FilterTabs
        label="Filter tickets"
        items={[undefined, ...TICKET_STATUSES].map((value) => ({
          label: value
            ? value[0].toUpperCase() + value.slice(1).replace("-", " ")
            : "All",
          href: value ? `/admin/tickets?status=${value}` : "/admin/tickets",
          active: filter === value,
        }))}
      />
      <TicketList
        tickets={tickets}
        basePath="/admin/tickets"
        viewer="admin"
        emptyMessage="No tickets here."
      />
    </>
  )
}
