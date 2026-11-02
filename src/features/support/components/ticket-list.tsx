import Link from "next/link"
import { formatDate } from "@/features/billing/domain/format"

import { EmptyState } from "@/components/ui/empty-state"

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
    return <EmptyState>{emptyMessage}</EmptyState>
  }

  const waitingLabel = (ticket: SupportTicket) => {
    const waitingOnClient = ticket.lastReplyBy === "admin"
    if (viewer === "client")
      return waitingOnClient ? "Awaiting your reply" : "Awaiting Cadogy"
    return waitingOnClient ? "Awaiting client" : "Needs a reply"
  }

  return (
    <ul className="rule-list">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <Link
            href={`${basePath}/${ticket.id}`}
            className="-mx-3 flex flex-col gap-2 rounded-field px-3 py-4 transition-colors hover:bg-foreground/5 sm:flex-row sm:items-center sm:justify-between"
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
