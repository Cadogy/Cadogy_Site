import { cn } from "@/lib/utils"

import type { InvoiceBadge } from "../domain/invoice"

const STYLES: Record<InvoiceBadge, { label: string; className: string }> = {
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
  refunded: {
    label: "Refunded",
    className: "border-border text-muted-foreground",
  },
  partially_refunded: {
    label: "Partially refunded",
    className: "border-success/40 bg-success/10 text-success",
  },
  settled_by_credit: {
    label: "Settled by credit",
    className: "border-success/40 bg-success/10 text-success",
  },
  disputed: {
    label: "Disputed",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
  uncollectible: {
    label: "Uncollectible",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
}

export function StatusBadge({ status }: { status: InvoiceBadge }) {
  const style = STYLES[status]
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        style.className
      )}
    >
      {style.label}
    </span>
  )
}
