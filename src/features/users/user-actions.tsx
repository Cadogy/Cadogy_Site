"use client"

import { useState, useTransition, type FormEvent } from "react"
import type { UserAction } from "@/features/auth/domain/user-admin"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  impersonateUserAction,
  manageUserAction,
  type RoleActionState,
} from "./actions"

const CONFIRMATIONS: Partial<Record<UserAction, (email: string) => string>> = {
  revoke_sessions: (email) => `Sign ${email} out on every device?`,
  reset_two_factor: (email) =>
    `Reset two-factor for ${email}? They'll be signed out and must set it up again. Only do this after confirming who they are.`,
  unban: (email) => `Unban ${email}?`,
  impersonate: (email) =>
    `View the portal as ${email}? They'll be emailed, and payments stay turned off.`,
}

export function UserActions({
  userId,
  email,
  actions,
}: {
  userId: string
  email: string
  actions: readonly UserAction[]
}) {
  const [state, setState] = useState<RoleActionState>(null)
  const [banning, setBanning] = useState(false)
  const [pending, start] = useTransition()

  const confirmed = (action: UserAction) => {
    const message = CONFIRMATIONS[action]?.(email)
    return !message || window.confirm(message)
  }

  const run = (action: Exclude<UserAction, "impersonate">, reason = "") => {
    if (action !== "ban" && !confirmed(action)) return
    start(async () => setState(await manageUserAction(userId, action, reason)))
  }

  const impersonate = () => {
    if (!confirmed("impersonate")) return
    start(async () => setState(await impersonateUserAction(userId)))
  }

  const submitBan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "")
    setBanning(false)
    run("ban", reason)
  }

  if (actions.length === 0) return null

  return (
    <div className="grid gap-2 sm:justify-items-end">
      <div className="flex flex-wrap gap-2">
        {actions.includes("impersonate") ? (
          <Button variant="outline" disabled={pending} onClick={impersonate}>
            View as client
          </Button>
        ) : null}
        {actions.includes("revoke_sessions") ? (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => run("revoke_sessions")}
          >
            Sign out everywhere
          </Button>
        ) : null}
        {actions.includes("reset_two_factor") ? (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => run("reset_two_factor")}
          >
            Reset two-factor
          </Button>
        ) : null}
        {actions.includes("unban") ? (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => run("unban")}
          >
            Unban
          </Button>
        ) : null}
        {actions.includes("ban") && !banning ? (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setBanning(true)}
          >
            Ban
          </Button>
        ) : null}
      </div>
      {banning ? (
        <form
          onSubmit={submitBan}
          className="flex w-full flex-wrap gap-2 sm:justify-end"
        >
          <label htmlFor={`ban-reason-${userId}`} className="sr-only">
            Reason for the ban
          </label>
          <Input
            id={`ban-reason-${userId}`}
            name="reason"
            placeholder="Reason (kept in the security log)"
            maxLength={200}
            className="min-w-0 flex-1 sm:w-64 sm:flex-none"
          />
          <Button type="submit" variant="destructive" disabled={pending}>
            Ban account
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setBanning(false)}
          >
            Cancel
          </Button>
        </form>
      ) : null}
      {state ? (
        <p
          role={state.ok ? "status" : "alert"}
          className={
            state.ok ? "text-sm text-success" : "text-sm text-destructive"
          }
        >
          {state.message}
        </p>
      ) : null}
    </div>
  )
}
