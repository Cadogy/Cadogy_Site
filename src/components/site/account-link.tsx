"use client"

import Link from "next/link"
import { authClient } from "@/features/auth/client"


import { cn } from "@/lib/utils"

export function AccountLink({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const { data: session } = authClient.useSession()
  const signedIn = Boolean(session)
  return (
    <Link
      href={signedIn ? "/dashboard" : "/login"}
      onClick={onNavigate}
      className={cn(className)}
    >
      {signedIn ? "Dashboard" : "Client login"}
    </Link>
  )
}
