"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { isActivePath } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function NavLink({
  href,
  children,
  className,
  onNavigate,
}: {
  href: string
  children: React.ReactNode
  className?: string
  onNavigate?: () => void
}) {
  const active = isActivePath(usePathname(), href)
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(className, active && "text-foreground")}
    >
      {children}
    </Link>
  )
}
