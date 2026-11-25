"use client"

import { useState, useTransition } from "react"

import type { ActionState } from "@/lib/action-state"
import { ActionMessage } from "@/components/ui/action-controls"
import { Button } from "@/components/ui/button"

export function AccessDecision({
  onDecide,
}: {
  onDecide: (
    decision: "approve" | "decline"
  ) => Promise<NonNullable<ActionState>>
}) {
  const [result, setResult] = useState<ActionState>(null)
  const [pending, start] = useTransition()

  if (result) return <ActionMessage state={result} className="text-base" />

  const decide = (decision: "approve" | "decline") =>
    start(async () => setResult(await onDecide(decision)))

  return (
    <div className="flex flex-wrap gap-3">
      <Button disabled={pending} onClick={() => decide("approve")}>
        Approve access
      </Button>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => decide("decline")}
      >
        Decline
      </Button>
    </div>
  )
}
