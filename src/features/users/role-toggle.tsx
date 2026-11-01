"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"

import { setUserRoleAction } from "./actions"

export function RoleToggle({
  userId,
  role,
  isSelf,
}: {
  userId: string
  role: "user" | "admin"
  isSelf: boolean
}) {
  const [pending, startTransition] = useTransition()
  if (isSelf) return <span className="text-sm text-muted-foreground">You</span>
  const next = role === "admin" ? "user" : "admin"
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        const message =
          next === "admin"
            ? "Give this user full admin access?"
            : "Remove admin access?"
        if (window.confirm(message))
          startTransition(() => setUserRoleAction(userId, next))
      }}
    >
      {next === "admin" ? "Make admin" : "Remove admin"}
    </Button>
  )
}
