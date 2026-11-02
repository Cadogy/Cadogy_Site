"use client"

import Link from "next/link"
import { authClient } from "@/features/auth/client"
import { toRole } from "@/features/auth/domain/permissions"

import { cn } from "@/lib/utils"
import { UserMenu } from "@/components/portal/user-menu"

export function AccountLink({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const { data: session } = authClient.useSession()
  return (
    <Link
      href={session ? "/dashboard" : "/login"}
      onClick={onNavigate}
      className={cn(className)}
    >
      {session ? "Dashboard" : "Sign in"}
    </Link>
  )
}

export function AccountControl({ className }: { className?: string }) {
  const { data: session } = authClient.useSession()
  if (!session)
    return (
      <Link href="/login" className={cn(className)}>
        Sign in
      </Link>
    )
  return (
    <UserMenu
      user={{
        name: session.user.name,
        email: session.user.email,
        role: toRole(session.user.role),
      }}
    />
  )
}
