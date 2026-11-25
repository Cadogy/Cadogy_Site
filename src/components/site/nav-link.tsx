"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { isActivePath } from "@/lib/navigation"
import { cn } from "@/lib/utils"

type NavLinkProps = {
  href: string
  children: React.ReactNode
  className?: string
  onNavigate?: () => void
}

export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<PlainNavLink {...props} active={false} />}>
      <ActiveNavLink {...props} />
    </Suspense>
  )
}

function ActiveNavLink(props: NavLinkProps) {
  return (
    <PlainNavLink {...props} active={isActivePath(usePathname(), props.href)} />
  )
}

function PlainNavLink({
  href,
  children,
  className,
  onNavigate,
  active,
}: NavLinkProps & { active: boolean }) {
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
