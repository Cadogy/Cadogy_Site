"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/features/auth/client"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { FormAlert } from "./auth-card"
import { authErrorMessage } from "./auth-errors"

type Mode = "totp" | "backup"

export function TwoFactorForm({ callbackPath }: { callbackPath: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("totp")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<{
    message: string
    expired: boolean
  } | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const code = String(form.get("code") ?? "").trim()
    const trustDevice = form.get("trustDevice") === "on"
    setPending(true)
    setError(null)

    const result =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code, trustDevice })
        : await authClient.twoFactor.verifyBackupCode({ code, trustDevice })

    if (!result.error) {
      router.replace(callbackPath)
      router.refresh()
      return
    }
    setPending(false)
    setError({
      message: authErrorMessage(result.error),
      expired: result.error.code === "INVALID_TWO_FACTOR_COOKIE",
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      {error ? (
        <FormAlert>
          {error.message}{" "}
          {error.expired ? (
            <Link href="/login" className="underline underline-offset-4">
              Sign in again
            </Link>
          ) : null}
        </FormAlert>
      ) : null}

      {mode === "totp" ? (
        <Field
          id="code"
          label="Authentication code"
          hint="Open your authenticator app and enter the 6-digit code for Cadogy."
        >
          {(control) => (
            <Input
              {...control}
              key="totp"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
            />
          )}
        </Field>
      ) : (
        <Field
          id="code"
          label="Backup code"
          hint="Each backup code works once."
        >
          {(control) => (
            <Input
              {...control}
              key="backup"
              name="code"
              autoComplete="off"
              spellCheck={false}
              required
              autoFocus
            />
          )}
        </Field>
      )}

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="trustDevice"
          className="size-5 accent-foreground"
        />
        Trust this device for 30 days
      </label>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Verify
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setMode(mode === "totp" ? "backup" : "totp")
          setError(null)
        }}
      >
        {mode === "totp" ? "Use a backup code" : "Use your authenticator app"}
      </Button>
    </form>
  )
}
