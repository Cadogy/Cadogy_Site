import { cn } from "@/lib/utils"

export const pillTabTone = (active: boolean) =>
  active
    ? "bg-foreground/8 text-foreground"
    : "text-muted-foreground hover:text-foreground"

export const pillTabClass = (active: boolean) =>
  cn(
    "inline-flex min-h-11 shrink-0 items-center rounded-control px-4 text-sm transition-colors",
    pillTabTone(active)
  )
