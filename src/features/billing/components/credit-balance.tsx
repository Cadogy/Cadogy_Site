"use client"

import { useState, useTransition, type FormEvent } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import type { Currency } from "../domain/schema"

type Result = { readonly ok: boolean; readonly message: string }

export function BalanceCreditForm({
  currency,
  onSubmit,
}: {
  currency: Currency
  onSubmit: (request: {
    readonly amount: string
    readonly reason: string
    readonly currency: Currency
  }) => Promise<Result>
}) {
  const [result, setResult] = useState<Result | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      const outcome = await onSubmit({
        amount: String(data.get("amount") ?? ""),
        reason: String(data.get("reason") ?? ""),
        currency,
      })
      setResult(outcome)
      if (outcome.ok) form.reset()
    })
  }

  return (
    <form
      className="grid gap-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
      onSubmit={submit}
    >
      {result ? (
        <p
          role={result.ok ? "status" : "alert"}
          className={`sm:col-span-3 ${result.ok ? "text-sm text-success" : "text-sm text-destructive"}`}
        >
          {result.message}
        </p>
      ) : null}
      <Field id="balance-amount" label="Amount">
        {(control) => (
          <Input {...control} name="amount" inputMode="decimal" required />
        )}
      </Field>
      <Field id="balance-reason" label="Reason">
        {(control) => <Input {...control} name="reason" required />}
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Add credit
      </Button>
    </form>
  )
}
