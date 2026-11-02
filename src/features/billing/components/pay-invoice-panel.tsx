"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, CreditCard, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { DisplayStatus } from "../domain/invoice"
import { startCheckoutAction } from "../server/actions"

export function PayInvoicePanel({
  token,
  payable,
  onlinePaymentAvailable,
  amountDueLabel,
  dueLabel,
  status,
  paymentReturned,
}: {
  token: string
  payable: boolean
  onlinePaymentAvailable: boolean
  amountDueLabel: string
  dueLabel: string | null
  status: DisplayStatus
  paymentReturned: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const pay = () =>
    startTransition(async () => {
      const result = await startCheckoutAction(token)
      if (result) setError(result.message)
    })

  return (
    <aside className="print-hidden grid gap-4 rounded-2xl border bg-card p-5 sm:p-6">
      {status === "paid" ? (
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 size-5 text-success"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">Paid in full</p>
            <p className="text-sm text-muted-foreground">
              Thank you. A receipt has been emailed to you.
            </p>
          </div>
        </div>
      ) : null}

      {paymentReturned && status !== "paid" ? (
        <p
          role="status"
          className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm"
        >
          Payment received — it can take a minute to appear here.
        </p>
      ) : null}

      {status === "void" ? (
        <p className="text-sm text-muted-foreground">
          This invoice has been voided and no payment is due.
        </p>
      ) : null}

      {payable ? (
        <>
          <div>
            <p className="text-sm text-muted-foreground">Amount due</p>
            <p className="text-3xl font-semibold tracking-tight">
              {amountDueLabel}
            </p>
            {dueLabel ? (
              <p
                className={
                  status === "overdue"
                    ? "text-sm text-warning"
                    : "text-sm text-muted-foreground"
                }
              >
                {status === "overdue"
                  ? `Was due ${dueLabel}`
                  : `Due ${dueLabel}`}
              </p>
            ) : null}
          </div>
          {onlinePaymentAvailable ? (
            <Button size="lg" onClick={pay} disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CreditCard className="size-4" aria-hidden="true" />
              )}
              Pay online
            </Button>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {onlinePaymentAvailable
              ? "Secure card payment by Stripe. Prefer bank transfer? See the note on the invoice or reply to the invoice email."
              : "See the note on the invoice for payment instructions, or reply to the invoice email."}
          </p>
        </>
      ) : null}

      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="size-4" aria-hidden="true" />
        Download PDF
      </Button>
    </aside>
  )
}
