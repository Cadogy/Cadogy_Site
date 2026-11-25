import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ArrowLink({
  href,
  children,
  ariaLabel,
}: {
  href: string
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <Button asChild variant="secondary" className="group">
      <Link href={href} aria-label={ariaLabel}>
        {children}
        <ArrowRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </Button>
  )
}
