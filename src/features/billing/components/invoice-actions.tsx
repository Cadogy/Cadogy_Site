"use client"

import { startTransition, useActionState, useState, useTransition } from "react"
import { Copy, Loader2, Printer, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"

import { PAYMENT_METHODS, type InvoiceStatus } from "../domain/schema"
import {
  duplicateInvoiceAction,
  invoiceCommandAction,
  recordPaymentAction,
  type ActionState,
} from "../server/actions"
import { resendInvoiceAction } from "../server/team-actions"

const METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  stripe: "Card (Stripe)",
  bank_transfer: "Bank transfer",
  check: "Check",
  cash: "Cash",
  other: "Other",
}

function RecordPaymentDialog({
  invoiceId,
  amountDue,
}: {
  invoiceId: string
  amountDue: string
}) {
  const [open, setOpen] = useState(false)
  const [state, dispatch, pending] = useActionState(
    recordPaymentAction.bind(null, invoiceId),
    null
  )
  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Record payment</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            For payments received outside of online checkout.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            startTransition(() => dispatch(data))
          }}
        >
          {state ? (
            <p
              role={state.ok ? "status" : "alert"}
              className={
                state.ok ? "text-sm text-success" : "text-sm text-destructive"
              }
            >
              {state.message}
            </p>
          ) : null}
          <Field id="amount" label="Amount">
            {(control) => (
              <Input
                {...control}
                name="amount"
                inputMode="decimal"
                defaultValue={amountDue}
                required
              />
            )}
          </Field>
          <Field id="method" label="Method">
            {(control) => (
              <NativeSelect
                {...control}
                name="method"
                defaultValue="bank_transfer"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {METHOD_LABELS[method]}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <Field id="paidAt" label="Date received">
            {(control) => (
              <Input
                {...control}
                name="paidAt"
                type="date"
                defaultValue={today}
                required
              />
            )}
          </Field>
          <Field id="reference" label="Reference" optional>
            {(control) => (
              <Input
                {...control}
                name="reference"
                placeholder="Wire or check number"
              />
            )}
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Record payment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function InvoiceActions({
  invoiceId,
  status,
  publicUrl,
  amountDue,
}: {
  invoiceId: string
  status: InvoiceStatus
  publicUrl: string
  amountDue: string
}) {
  const [feedback, setFeedback] = useState<ActionState>(null)
  const [pending, startCommand] = useTransition()
  const open = status === "open"

  const command =
    (name: "remind" | "void" | "uncollectible", confirmation?: string) =>
    () => {
      if (confirmation && !window.confirm(confirmation)) return
      startCommand(async () =>
        setFeedback(await invoiceCommandAction(invoiceId, name))
      )
    }

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl)
    setFeedback({ ok: true, message: "Payment link copied." })
  }

  return (
    <div className="print-hidden grid gap-3 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Actions</h2>
      {feedback ? (
        <p
          role={feedback.ok ? "status" : "alert"}
          className={
            feedback.ok ? "text-sm text-success" : "text-sm text-destructive"
          }
        >
          {feedback.message}
        </p>
      ) : null}
      <Button variant="outline" onClick={copyLink}>
        <Copy className="size-4" aria-hidden="true" />
        Copy payment link
      </Button>
      {open ? (
        <>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startCommand(async () =>
                setFeedback(await resendInvoiceAction(invoiceId))
              )
            }
          >
            <Send className="size-4" aria-hidden="true" />
            Email to billing contacts
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={command("remind")}
          >
            Send reminder
          </Button>
          <RecordPaymentDialog invoiceId={invoiceId} amountDue={amountDue} />
        </>
      ) : null}
      {status === "uncollectible" ? (
        <RecordPaymentDialog invoiceId={invoiceId} amountDue={amountDue} />
      ) : null}
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startCommand(async () => {
            const result = await duplicateInvoiceAction(invoiceId)
            if (result) setFeedback(result)
          })
        }
      >
        Duplicate as new draft
      </Button>
      <Button variant="ghost" onClick={() => window.print()}>
        <Printer className="size-4" aria-hidden="true" />
        Print or save PDF
      </Button>
      {open ? (
        <div className="grid gap-2 border-t pt-3">
          <Button
            variant="ghost"
            className="text-destructive"
            disabled={pending}
            onClick={command(
              "void",
              "Void this invoice? The client will no longer be able to pay it."
            )}
          >
            Void invoice
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground"
            disabled={pending}
            onClick={command(
              "uncollectible",
              "Write this invoice off as uncollectible?"
            )}
          >
            Mark uncollectible
          </Button>
        </div>
      ) : null}
    </div>
  )
}
