import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  ReplyForm,
  TicketStatusSelect,
} from "@/features/support/components/ticket-forms"
import { TicketThread } from "@/features/support/components/ticket-thread"
import { support } from "@/features/support/server/support"
import { User } from "@/models/User"

import { connectToDatabase } from "@/lib/mongodb"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Ticket" }

type Props = { params: Promise<{ id: string }> }

export default async function AdminTicketPage({ params }: Props) {
  const { id } = await params
  const ticket = await support.get(id)
  if (!ticket) notFound()
  await connectToDatabase()
  const client = await User.findById(ticket.userId).lean()

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
