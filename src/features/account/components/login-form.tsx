"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient, humanCheckHeaders } from "@/features/auth/client"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { HumanCheck } from "@/components/security/human-check"

import { FormAlert } from "./auth-card"
import { authErrorMessage } from "./auth-errors"

export function LoginForm({
  callbackPath,
  turnstileSiteKey,
}: {
  callbackPath: string
  turnstileSiteKey: string | undefined
}) {
  const router = useRouter()
  const [turnstileToken, setTurnstileToken] = useState("")
  const [checkKey, setCheckKey] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError(null)

    const result = await authClient.signIn.email(
      {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      },
      { headers: humanCheckHeaders(turnstileToken) }
    )

    if (!result.error) {
      router.replace(callbackPath)
      router.refresh()
      return
    }

    setPending(false)
    setError(authErrorMessage(result.error))
    setTurnstileToken("")
    setCheckKey((key) => key + 1)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      {error ? <FormAlert>{error}</FormAlert> : null}

      <Field id="email" label="Email">
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        )}
      </Field>
      <div className="grid gap-2">
        <Field id="password" label="Password">
          {(control) => (
            <Input
              {...control}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          )}
        </Field>
        <Link
          href="/forgot-password"
          className="inline-flex min-h-11 items-center justify-self-end text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Forgot your password?
        </Link>
      </div>

      <HumanCheck
        key={checkKey}
        siteKey={turnstileSiteKey}
        onToken={setTurnstileToken}
      />

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Sign in
      </Button>
    </form>
  )
}
