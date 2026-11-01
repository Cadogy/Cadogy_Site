import { cn } from "@/lib/utils"

import type { TicketStatus } from "../application/support-service"

const STYLES: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "border-brand/40 bg-brand/10 text-brand" },
  "in-progress": {
    label: "In progress",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  resolved: {
    label: "Resolved",
    className: "border-success/40 bg-success/10 text-success",
  },
  closed: { label: "Closed", className: "border-border text-muted-foreground" },
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[status].className
      )}
    >
      {STYLES[status].label}
    </span>
  )
}
