import { formatDate } from "@/features/billing/domain/format"

import { cn } from "@/lib/utils"

import type { SupportTicket } from "../application/support-service"

export function TicketThread({
  ticket,
  viewerIsClient,
  clientLabel,
}: {
  ticket: SupportTicket
  viewerIsClient: boolean
  clientLabel: string
}) {
  return (
    <ol className="grid gap-4">
      {ticket.messages.map((message, index) => {
        const fromClient = message.authorId === ticket.userId
        const mine = fromClient === viewerIsClient
        return (
          <li
            key={`${message.createdAt.toISOString()}-${index}`}
            className={cn(
              "rounded-xl border p-4 sm:p-5",
              mine ? "bg-card sm:ml-10" : "bg-muted/40 sm:mr-10"
            )}
          >
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {fromClient ? clientLabel : "Cadogy"}
              </span>
              {" · "}
              <time dateTime={message.createdAt.toISOString()}>
                {formatDate(message.createdAt)}
              </time>
            </p>
            <p className="mt-2 leading-relaxed whitespace-pre-line">
              {message.content}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
