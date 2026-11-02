"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/features/auth/client"
import { describeDevice } from "@/features/auth/domain/devices"
import { KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"

import { FormAlert } from "./auth-card"
import { authErrorMessage } from "./auth-errors"

export type SavedPasskey = {
  readonly id: string
  readonly name: string
  readonly createdLabel: string
}

type ClientResult = {
  readonly error: { code?: string; message?: string; status: number } | null
}

export function PasskeySettings({
  passkeys,
}: {
  passkeys: readonly SavedPasskey[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const run = (action: () => Promise<ClientResult>) =>
    start(async () => {
      setError(null)
      const result = await action()
      if (result.error) return setError(authErrorMessage(result.error))
      router.refresh()
    })

  const add = () =>
    run(() =>
      authClient.passkey.addPasskey({
        name: describeDevice(navigator.userAgent),
      })
    )

  return (
    <div className="grid gap-5">
      {error ? <FormAlert>{error}</FormAlert> : null}
      {passkeys.length === 0 ? (
        <p className="border-t pt-5 text-sm">
          No passkeys yet. A passkey lets you sign in with Face ID, Touch ID,
          Windows Hello or a security key, and counts as two-factor on its own.
        </p>
      ) : (
        <ul className="rule-list">
          {passkeys.map((passkey) => (
            <li
              key={passkey.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4"
            >
              <KeyRound
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="grid min-w-0 flex-1">
                <span className="font-medium">{passkey.name}</span>
                <span className="text-sm text-muted-foreground">
                  Added {passkey.createdLabel}
                </span>
              </div>
              <Button
                variant="ghost"
                disabled={pending}
                aria-label={`Remove ${passkey.name}`}
                onClick={() =>
                  run(() =>
                    authClient.passkey.deletePasskey({ id: passkey.id })
                  )
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Button variant="outline" disabled={pending} onClick={add}>
          <KeyRound className="size-4" aria-hidden="true" />
          Add a passkey
        </Button>
      </div>
    </div>
  )
}
