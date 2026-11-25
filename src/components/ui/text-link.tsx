import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"

const textLinkClass =
  "inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"

export function TextLink({
  href,
  external = false,
  className,
  children,
}: {
  href: string
  external?: boolean
  className?: string
  children: React.ReactNode
}) {
  if (external)
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(textLinkClass, className)}
      >
        {children}
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </a>
    )
  return (
    <Link href={href} className={cn(textLinkClass, className)}>
      {children}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  )
}
