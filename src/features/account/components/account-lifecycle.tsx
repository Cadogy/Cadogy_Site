"use client"

import { useState, useTransition, type FormEvent } from "react"
import { authClient } from "@/features/auth/client"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { FormAlert } from "./auth-card"
import { authErrorMessage } from "./auth-errors"

type Result = { readonly ok: boolean; readonly message: string }

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [result, setResult] = useState<Result | null>(null)
  const [pending, start] = useTransition()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const newEmail = String(
      new FormData(event.currentTarget).get("newEmail") ?? ""
    ).trim()
    if (newEmail.toLowerCase() === currentEmail.toLowerCase())
      return setResult({ ok: false, message: "That's already your email." })
    start(async () => {
      const response = await authClient.changeEmail({
        newEmail,
        callbackURL: "/account",
      })
      setResult(
        response.error
          ? { ok: false, message: authErrorMessage(response.error) }
          : {
              ok: true,
              message: `We've sent a confirmation link to ${currentEmail}. After you confirm, we'll verify ${newEmail}.`,
            }
      )
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      {result ? (
        <FormAlert tone={result.ok ? "success" : "error"}>
          {result.message}
        </FormAlert>
      ) : null}
      <Field
        id="newEmail"
        label="New email"
        hint="Your invoices go to your billing email. Reply to any invoice and we'll update that too."
      >
        {(control) => (
          <Input
            {...control}
            name="newEmail"
            type="email"
            autoComplete="email"
            required
          />
        )}
      </Field>
      <div>
        <Button type="submit" variant="outline" disabled={pending}>
          Change email
        </Button>
      </div>
    </form>
  )
}

export function DeleteAccount({
  allowed,
  reason,
  onRequest,
}: {
  allowed: boolean
  reason?: string
  onRequest: () => Promise<Result>
}) {
  const [result, setResult] = useState<Result | null>(null)
  const [pending, start] = useTransition()

  if (!allowed) return <p className="text-sm text-muted-foreground">{reason}</p>

  const request = () => {
    if (
      !window.confirm(
        "Delete your account? We'll email you a link to confirm. Paid invoices stay on record."
      )
    )
      return
    start(async () => setResult(await onRequest()))
  }

  return (
    <div className="grid gap-4">
      {result ? (
        <FormAlert tone={result.ok ? "success" : "error"}>
          {result.message}
        </FormAlert>
      ) : null}
      <div>
        <Button variant="destructive" disabled={pending} onClick={request}>
          Delete my account
        </Button>
      </div>
    </div>
  )
}
