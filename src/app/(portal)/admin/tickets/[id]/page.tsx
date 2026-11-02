import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { findUserContact } from "@/features/auth/server/database"
import {
  ReplyForm,
  TicketStatusSelect,
} from "@/features/support/components/ticket-forms"
import { TicketThread } from "@/features/support/components/ticket-thread"
import { support } from "@/features/support/server/support"

import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Ticket" }

type Props = { params: Promise<{ id: string }> }

export default async function AdminTicketPage({ params }: Props) {
  const { id } = await params
  const ticket = await support.get(id)
  if (!ticket) notFound()
  const client = await findUserContact(ticket.userId)

  return (
    <div className="max-w-3xl">
      <PortalPageHeader
        title={ticket.subject}
        description={client?.email}
        actions={
          <TicketStatusSelect ticketId={ticket.id} status={ticket.status} />
        }
      />
      <TicketThread
        ticket={ticket}
        viewerIsClient={false}
        clientLabel={client?.name || client?.email || "Client"}
      />
      <div className="mt-8 border-t pt-6">
        <ReplyForm ticketId={ticket.id} as="admin" />
      </div>
    </div>
  )
}
