"use client"

import { useState, useTransition } from "react"
import { Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"

export type DeviceSession = {
  readonly id: string
  readonly device: string
  readonly ip: string
  readonly lastActiveLabel: string
  readonly current: boolean
}

type ActionResult = { readonly ok: boolean; readonly message: string }

export function SessionList({
  sessions,
  onRevoke,
  onRevokeOthers,
}: {
  sessions: readonly DeviceSession[]
  onRevoke: (sessionId: string) => Promise<ActionResult>
  onRevokeOthers: () => Promise<ActionResult>
}) {
  const [result, setResult] = useState<ActionResult | null>(null)
  const [pending, start] = useTransition()
  const run = (action: () => Promise<ActionResult>) =>
    start(async () => setResult(await action()))

  return (
    <div className="grid gap-4">
      <ul className="divide-y border-y">
        {sessions.map((session) => (
          <li
            key={session.id}
            aria-label={session.device}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4"
          >
            <Monitor
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="grid min-w-0 flex-1">
              <span className="font-medium">{session.device}</span>
              <span className="text-sm text-muted-foreground">
                {session.ip || "Unknown network"} · Active{" "}
                {session.lastActiveLabel}
              </span>
            </div>
            {session.current ? (
              <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                This device
              </span>
            ) : (
              <Button
                variant="ghost"
                disabled={pending}
                aria-label={`Sign out ${session.device}`}
                onClick={() => run(() => onRevoke(session.id))}
              >
                Sign out
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-4">
        {sessions.length > 1 ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => run(onRevokeOthers)}
          >
            Sign out all other devices
          </Button>
        ) : null}
        {result ? (
          <p
            role={result.ok ? "status" : "alert"}
            className={
              result.ok ? "text-sm text-success" : "text-sm text-destructive"
            }
          >
            {result.message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
