"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

type Result = { readonly ok: boolean; readonly message: string }

export function AccessDecision({
  onDecide,
}: {
  onDecide: (decision: "approve" | "decline") => Promise<Result>
}) {
  const [result, setResult] = useState<Result | null>(null)
  const [pending, start] = useTransition()

  if (result)
    return (
      <p
        role={result.ok ? "status" : "alert"}
        className={result.ok ? "text-success" : "text-destructive"}
      >
        {result.message}
      </p>
    )

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
