"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"

export function AccountLink({
  className,
  onNavigate,
}: {
  className?: string
  onNavigate?: () => void
}) {
  const { status } = useSession()
  const signedIn = status === "authenticated"
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
