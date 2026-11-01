"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`)

export function NavLink({
  href,
  children,
  className,
  activeClassName,
  onNavigate,
}: {
  href: string
  children: React.ReactNode
  className?: string
  activeClassName?: string
  onNavigate?: () => void
}) {
  const active = isActive(usePathname(), href)
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(className, active && activeClassName)}
    >
      {children}
    </Link>
  )
}
