"use client"

import { useState, useTransition } from "react"
import Link from "next/link"

import type { ActionState } from "@/lib/action-state"
import { ActionMessage } from "@/components/ui/action-controls"
import { Button } from "@/components/ui/button"

export type InvoiceAccountState = "guest" | "member" | "outsider"

export function InvoiceAccountPrompt({
  state,
  invoicePath,
  onRequest,
}: {
  state: InvoiceAccountState
  invoicePath: string
  onRequest: () => Promise<NonNullable<ActionState>>
}) {
  const [result, setResult] = useState<ActionState>(null)
  const [pending, start] = useTransition()

  return (
    <aside className="print-hidden grid gap-3 border-t pt-5 text-sm">
      {state === "member" ? (
        <>
          <p>This invoice is in your account.</p>
          <Link
            href="/dashboard/billing"
            className="font-medium underline underline-offset-4"
          >
            Open your billing
          </Link>
        </>
      ) : null}

      {state === "guest" ? (
        <>
          <p className="font-medium">Keep your invoices in one place</p>
          <p className="text-muted-foreground">
            You can pay without an account. Sign in or create one with your
            billing email to see every invoice, save a card and download
            statements.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(invoicePath)}`}
              >
                Sign in
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </>
      ) : null}

      {state === "outsider" ? (
        <>
          <p className="font-medium">Add this to your account?</p>
          <p className="text-muted-foreground">
            You&apos;re signed in with an email that isn&apos;t on this account.
            We&apos;ll ask the account&apos;s billing contacts to approve you.
          </p>
          {result ? (
            <ActionMessage state={result} className="text-base" />
          ) : (
            <div>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => start(async () => setResult(await onRequest()))}
              >
                Request access
              </Button>
            </div>
          )}
        </>
      ) : null}
    </aside>
  )
}
