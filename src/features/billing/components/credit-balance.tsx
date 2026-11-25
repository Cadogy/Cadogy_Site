"use client"

import { useState, useTransition, type FormEvent } from "react"

import type { ActionState } from "@/lib/action-state"
import { ActionMessage } from "@/components/ui/action-controls"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PendingButton } from "@/components/ui/pending-button"

import type { Currency } from "../domain/schema"

export function BalanceCreditForm({
  currency,
  onSubmit,
}: {
  currency: Currency
  onSubmit: (request: {
    readonly amount: string
    readonly reason: string
    readonly currency: Currency
  }) => Promise<NonNullable<ActionState>>
}) {
  const [result, setResult] = useState<ActionState>(null)
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
      <ActionMessage state={result} className="sm:col-span-3" />
      <Field id="balance-amount" label="Amount">
        {(control) => (
          <Input {...control} name="amount" inputMode="decimal" required />
        )}
      </Field>
      <Field id="balance-reason" label="Reason">
        {(control) => <Input {...control} name="reason" required />}
      </Field>
      <PendingButton type="submit" pending={pending}>
        Add credit
      </PendingButton>
    </form>
  )
}
