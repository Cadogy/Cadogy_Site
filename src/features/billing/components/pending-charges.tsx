"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

import type { ActionState } from "../server/actions"
import { ActionMessage } from "./action-controls"

export type PendingChargeRow = {
  readonly id: string
  readonly description: string
  readonly amountLabel: string
}

export function PendingCharges({
  charges,
  onBill,
  onRemove,
}: {
  charges: readonly PendingChargeRow[]
  onBill: (chargeIds: readonly string[] | "all") => Promise<ActionState>
  onRemove: (chargeId: string) => Promise<ActionState>
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
          <li key={charge.id} className="flex items-center gap-3 py-2">
            <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="size-5 accent-foreground"
                checked={selected.includes(charge.id)}
                onChange={() => toggle(charge.id)}
              />
              <span className="flex-1">{charge.description}</span>
              <span className="font-medium tabular-nums">
                {charge.amountLabel}
              </span>
            </label>
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
          </li>
        ))}
      </ul>
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
    </div>
  )
}
