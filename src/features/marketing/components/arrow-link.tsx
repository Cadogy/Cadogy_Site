import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

export function ArrowLink({
  href,
  children,
  className,
  ariaLabel,
}: {
  href: string
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "group inline-flex h-11 items-center gap-2 rounded-full bg-foreground/8 px-5 text-sm font-medium transition-colors hover:bg-foreground/[0.14]",
        className
      )}
    >
      {children}
      <ArrowRight
        className="size-4 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  )
}
