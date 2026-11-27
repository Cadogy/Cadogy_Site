"use client"

import { useState, useTransition } from "react"

import type { ActionState } from "@/lib/action-state"
import { ActionForm, ActionMessage } from "@/components/ui/action-controls"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { PriceField, QuantityField } from "./service-fields"

export type PendingChargeRow = {
  readonly id: string
  readonly description: string
  readonly amountLabel: string
  readonly quantity: number
  readonly unitAmount: number
}

type UpdateCharge = (
  chargeId: string,
  previous: ActionState,
  formData: FormData
) => Promise<ActionState>

export function PendingCharges({
  charges,
  onBill,
  onRemove,
  onUpdate,
  readOnly = false,
}: {
  charges: readonly PendingChargeRow[]
  onBill: (chargeIds: readonly string[] | "all") => Promise<ActionState>
  onRemove: (chargeId: string) => Promise<ActionState>
  onUpdate: UpdateCharge
  /** Archived clients: show what's pending without billing actions. */
  readOnly?: boolean
}) {
  const [selected, setSelected] = useState<readonly string[]>([])
  const [state, setState] = useState<ActionState>(null)
  const [pending, start] = useTransition()

  const run = (action: () => Promise<ActionState>) =>
    start(async () => {
      const result = await action()
      setState(result)
      if (result?.ok) setSelected([])
    })

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    )

  if (charges.length === 0) {
    return (
      <div className="grid gap-3">
        <p className="border-t py-6 text-muted-foreground">
          Nothing waiting to be billed.
        </p>
        <ActionMessage state={state} />
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <ul className="rule-list">
        {charges.map((charge) => (
          <li key={charge.id} className="grid gap-1 py-2">
            <div className="flex items-center gap-3">
              <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                {readOnly ? null : (
                  <input
                    type="checkbox"
                    className="size-5 accent-foreground"
                    checked={selected.includes(charge.id)}
                    onChange={() => toggle(charge.id)}
                  />
                )}
                <span className="flex-1">{charge.description}</span>
                <span className="font-medium tabular-nums">
                  {charge.amountLabel}
                </span>
              </label>
              {readOnly ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${charge.description}`}
                  disabled={pending}
                  onClick={() => run(() => onRemove(charge.id))}
                >
                  <span aria-hidden="true">×</span>
                </Button>
              )}
            </div>
            {readOnly ? null : (
              <details>
                <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
                  Edit
                </summary>
                <div className="pt-2 pb-4">
                  <ActionForm
                    action={(previous, formData) =>
                      onUpdate(charge.id, previous, formData)
                    }
                    submitLabel="Save charge"
                    resetOnSuccess={false}
                  >
                    <div className="grid gap-5 sm:grid-cols-[2fr_1fr_1fr]">
                      <Field
                        id={`charge-${charge.id}-description`}
                        label="Description"
                      >
                        {(control) => (
                          <Input
                            {...control}
                            name="description"
                            defaultValue={charge.description}
                            required
                          />
                        )}
                      </Field>
                      <PriceField
                        id={`charge-${charge.id}-price`}
                        defaultValue={charge.unitAmount}
                      />
                      <QuantityField
                        id={`charge-${charge.id}-quantity`}
                        defaultValue={charge.quantity}
                      />
                    </div>
                  </ActionForm>
                </div>
              </details>
            )}
          </li>
        ))}
      </ul>
      {readOnly ? null : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={pending}
            onClick={() => run(() => onBill("all"))}
          >
            Bill all
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || selected.length === 0}
            onClick={() => run(() => onBill(selected))}
          >
            Bill selected
          </Button>
          <ActionMessage state={state} />
        </div>
      )}
    </div>
  )
}
