import Link from "next/link"
import { formatDate } from "@/features/billing/domain/format"

import type { SupportTicket } from "../application/support-service"
import { TicketStatusBadge } from "./ticket-status-badge"

export function TicketList({
  tickets,
  basePath,
  emptyMessage,
  viewer,
}: {
  tickets: readonly SupportTicket[]
  basePath: string
  emptyMessage: string
  viewer: "client" | "admin"
}) {
  if (tickets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  const waitingLabel = (ticket: SupportTicket) => {
    const waitingOnClient = ticket.lastReplyBy === "admin"
    if (viewer === "client")
      return waitingOnClient ? "Awaiting your reply" : "Awaiting Cadogy"
    return waitingOnClient ? "Awaiting client" : "Needs a reply"
  }

  return (
    <ul className="divide-y overflow-hidden rounded-xl border">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <Link
            href={`${basePath}/${ticket.id}`}
            className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {ticket.subject}
              </span>
              <span className="block text-sm text-muted-foreground">
                Updated {formatDate(ticket.lastReplyAt)} ·{" "}
                {waitingLabel(ticket)}
              </span>
            </span>
            <TicketStatusBadge status={ticket.status} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
