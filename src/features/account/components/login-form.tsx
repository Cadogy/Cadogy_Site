"use client"

import { useEffect, useEffectEvent, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient, humanCheckHeaders } from "@/features/auth/client"
import { KeyRound, Loader2 } from "lucide-react"

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

  const finish = () => {
    router.replace(callbackPath)
    router.refresh()
  }

  const signInWithPasskey = async (autoFill = false) => {
    const result = await authClient.signIn.passkey({ autoFill })
    if (!result.error) return finish()
    if (!autoFill) setError(authErrorMessage(result.error))
  }

  const offerPasskeyAutofill = useEffectEvent(() => {
    void signInWithPasskey(true)
  })

  useEffect(() => {
    const conditional =
      globalThis.PublicKeyCredential?.isConditionalMediationAvailable
    if (!conditional) return
    void conditional.call(PublicKeyCredential).then((available) => {
      if (available) offerPasskeyAutofill()
    })
  }, [])

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
      if (result.data && "twoFactorRedirect" in result.data) {
        router.push(
          `/login/verify?callbackUrl=${encodeURIComponent(callbackPath)}`
        )
        return
      }
      return finish()
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
            autoComplete="username webauthn"
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

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        or
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      <Button
        type="button"
        size="lg"
        variant="outline"
        onClick={() => void signInWithPasskey()}
      >
        <KeyRound className="size-4" aria-hidden="true" />
        Sign in with a passkey
      </Button>
    </form>
  )
}
