"use client"

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PendingButton } from "@/components/ui/pending-button"
import { HumanCheck } from "@/components/security/human-check"
import {
  HumanCheckPending,
  isAwaitingHumanCheck,
} from "@/components/security/human-check-pending"

import {
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  type AccountAction,
} from "./auth-actions"
import { FormAlert } from "./auth-card"

const PASSWORD_HINT =
  "At least 12 characters. A short phrase of a few words works well."

const useAccountAction = (action: AccountAction) => {
  const [result, dispatch, pending] = useActionState(action, null)
  const submit =
    (extra: Record<string, string> = {}) =>
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      Object.entries(extra).forEach(([key, value]) => data.set(key, value))
      startTransition(() => dispatch(data))
    }
  const fieldError = (field: string) =>
    result && !result.ok && result.field === field ? result.error : undefined
  const formError =
    result && !result.ok && !result.field ? result.error : undefined
  return { result, pending, submit, fieldError, formError }
}

export function RegisterForm({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string | undefined
}) {
  const { result, pending, submit, fieldError, formError } =
    useAccountAction(registerAction)
  const [turnstileToken, setTurnstileToken] = useState("")
  const verifying = isAwaitingHumanCheck(turnstileSiteKey, turnstileToken)

  if (result?.ok) {
    return (
      <FormAlert tone="success">
        Check your inbox for a link to verify your email address. It expires in
        24 hours.
      </FormAlert>
    )
  }

  return (
    <form
      onSubmit={submit({ turnstileToken })}
      className="grid gap-5"
      noValidate
    >
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <Field id="name" label="Name" error={fieldError("name")}>
        {(control) => (
          <Input {...control} name="name" autoComplete="name" required />
        )}
      </Field>
      <Field id="email" label="Email" error={fieldError("email")}>
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
      <Field
        id="password"
        label="Password"
        hint={PASSWORD_HINT}
        error={fieldError("password")}
      >
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>
      <HumanCheck siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
      <HumanCheckPending show={verifying} />
      <PendingButton
        type="submit"
        size="lg"
        pending={pending}
        disabled={verifying}
      >
        Create account
      </PendingButton>
    </form>
  )
}

export function ForgotPasswordForm({
  turnstileSiteKey,
}: {
  turnstileSiteKey: string | undefined
}) {
  const { result, pending, submit, fieldError, formError } = useAccountAction(
    requestPasswordResetAction
  )
  const [turnstileToken, setTurnstileToken] = useState("")
  const verifying = isAwaitingHumanCheck(turnstileSiteKey, turnstileToken)

  if (result?.ok) {
    return (
      <FormAlert tone="success">
        If an account exists for that email, we&apos;ve sent a link to reset
        your password. It expires in one hour.
      </FormAlert>
    )
  }

  return (
    <form
      onSubmit={submit({ turnstileToken })}
      className="grid gap-5"
      noValidate
    >
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <Field id="email" label="Email" error={fieldError("email")}>
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
      <HumanCheck siteKey={turnstileSiteKey} onToken={setTurnstileToken} />
      <HumanCheckPending show={verifying} />
      <PendingButton
        type="submit"
        size="lg"
        pending={pending}
        disabled={verifying}
      >
        Send reset link
      </PendingButton>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { result, pending, submit, fieldError, formError } =
    useAccountAction(resetPasswordAction)

  if (result?.ok) {
    return (
      <div className="grid gap-5">
        <FormAlert tone="success">Your password has been updated.</FormAlert>
        <Button asChild size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit({ token })} className="grid gap-5" noValidate>
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      <Field
        id="password"
        label="New password"
        hint={PASSWORD_HINT}
        error={fieldError("password")}
      >
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>
      <Field
        id="confirmPassword"
        label="Confirm new password"
        error={fieldError("confirmPassword")}
      >
        {(control) => (
          <Input
            {...control}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>
      <PendingButton type="submit" size="lg" pending={pending}>
        Update password
      </PendingButton>
    </form>
  )
}
