import { cn } from "@/lib/utils"

import type { DisplayStatus } from "../domain/invoice"

const STYLES: Record<DisplayStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "border-border text-muted-foreground" },
  open: { label: "Open", className: "border-brand/40 bg-brand/10 text-brand" },
  overdue: {
    label: "Overdue",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  paid: {
    label: "Paid",
    className: "border-success/40 bg-success/10 text-success",
  },
  void: {
    label: "Void",
    className: "border-border text-muted-foreground line-through",
  },
  uncollectible: {
    label: "Uncollectible",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
}

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const style = STYLES[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        style.className
      )}
    >
      {style.label}
    </span>
  )
}
