import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ReplyForm } from "@/features/support/components/ticket-forms"
import { TicketStatusBadge } from "@/features/support/components/ticket-status-badge"
import { TicketThread } from "@/features/support/components/ticket-thread"
import { support } from "@/features/support/server/support"

import { requireSession } from "@/features/auth/server/session"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Support request" }

type Props = { params: Promise<{ id: string }> }

export default async function TicketPage({ params }: Props) {
  const { id } = await params
  const user = await requireSession(`/dashboard/tickets/${id}`)
  const ticket = await support.getForUser(user.id, id)
  if (!ticket) notFound()

  return (
    <div className="max-w-3xl">
      <PortalPageHeader
        title={ticket.subject}
        actions={<TicketStatusBadge status={ticket.status} />}
      />
      <TicketThread ticket={ticket} viewerIsClient clientLabel="You" />
      <div className="mt-8 border-t pt-6">
        {ticket.status === "closed" ? (
          <p className="text-muted-foreground">
            This request is closed. Open a new one if you need anything else.
          </p>
        ) : (
          <ReplyForm ticketId={ticket.id} as="user" />
        )}
      </div>
    </div>
  )
}
