"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { HumanCheck } from "@/components/security/human-check"

import { resendVerificationAction } from "../server/actions"
import { FormAlert } from "./auth-card"

const ERROR_MESSAGES: Record<string, string> = {
  InvalidCredentials: "Incorrect email or password.",
  EmailNotVerified: "Please verify your email address before signing in.",
  VerificationFailed: "We couldn't verify you're human. Please try again.",
}

export function LoginForm({
  callbackPath,
  turnstileSiteKey,
}: {
  callbackPath: string
  turnstileSiteKey: string | undefined
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")
  const [checkKey, setCheckKey] = useState(0)
  const [pending, setPending] = useState(false)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [resent, setResent] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setErrorCode(null)
    setResent(false)

    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      turnstileToken,
      redirect: false,
    })

    if (result?.ok && !result.error) {
      router.replace(callbackPath)
      router.refresh()
      return
    }

    setPending(false)
    setErrorCode(result?.error ?? "InvalidCredentials")
    setTurnstileToken("")
    setCheckKey((key) => key + 1)
  }

  const handleResend = async () => {
    await resendVerificationAction(email)
    setResent(true)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      {errorCode ? (
        <FormAlert>
          {ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.InvalidCredentials}
        </FormAlert>
      ) : null}
      {errorCode === "EmailNotVerified" && !resent ? (
        <Button type="button" variant="outline" onClick={handleResend}>
          Resend verification email
        </Button>
      ) : null}
      {resent ? (
        <FormAlert tone="success">
          If that account needs verifying, check your inbox for a new link.
        </FormAlert>
      ) : null}

      <Field id="email" label="Email">
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
