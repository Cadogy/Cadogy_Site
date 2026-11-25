"use client"

import { useState, useTransition, type FormEvent } from "react"

import type { ActionState } from "@/lib/action-state"
import { ActionMessage } from "@/components/ui/action-controls"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { PendingButton } from "@/components/ui/pending-button"

import type { InvoiceAdjustment } from "../domain/invoice"

type Kind = InvoiceAdjustment["kind"]

export type CreditNoteRequest = {
  readonly kind: Kind
  readonly amount: string
  readonly reason: string
}

const COPY: Record<Kind, { label: string; submit: string; help: string }> = {
  refund: {
    label: "Refund to card",
    submit: "Refund to card",
    help: "The money goes back to the card that paid. Stripe can't undo a refund.",
  },
  invoice_credit: {
    label: "Credit the invoice",
    submit: "Issue credit",
    help: "Lowers what's owed on this invoice. No money moves.",
  },
}

export function CreditNoteForm({
  refundable,
  owed,
  onSubmit,
}: {
  refundable: string | null
  owed: string | null
  onSubmit: (request: CreditNoteRequest) => Promise<NonNullable<ActionState>>
}) {
  const initial: Kind = refundable ? "refund" : "invoice_credit"
  const [kind, setKind] = useState<Kind>(initial)
  const [amount, setAmount] = useState(
    (initial === "refund" ? refundable : owed) ?? ""
  )
  const [reason, setReason] = useState("")
  const [result, setResult] = useState<ActionState>(null)
  const [pending, startTransition] = useTransition()
  const both = Boolean(refundable && owed)

  const choose = (next: Kind) => {
    setKind(next)
    setAmount((next === "refund" ? refundable : owed) ?? "")
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    startTransition(async () =>
      setResult(await onSubmit({ kind, amount, reason }))
    )
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <ActionMessage state={result} />
      {both ? (
        <Field id="credit-kind" label="Type">
          {(control) => (
            <NativeSelect
              {...control}
              value={kind}
              onChange={(event) =>
                choose(
                  event.target.value === "refund" ? "refund" : "invoice_credit"
                )
              }
            >
              <option value="refund">{COPY.refund.label}</option>
              <option value="invoice_credit">
                {COPY.invoice_credit.label}
              </option>
            </NativeSelect>
          )}
        </Field>
      ) : null}
      <Field
        id="credit-amount"
        label="Amount"
        hint={`Up to ${(kind === "refund" ? refundable : owed) ?? "0.00"}. ${COPY[kind].help}`}
      >
        {(control) => (
          <Input
            {...control}
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        )}
      </Field>
      <Field id="credit-reason" label="Reason" hint="Shown on the credit note.">
        {(control) => (
          <Input
            {...control}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          />
        )}
      </Field>
      <PendingButton type="submit" pending={pending}>
        {COPY[kind].submit}
      </PendingButton>
    </form>
  )
}
