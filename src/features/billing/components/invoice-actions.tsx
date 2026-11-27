"use client"

import { useState, useTransition } from "react"
import { Copy, CreditCard, Printer, Send } from "lucide-react"

import type { ActionState } from "@/lib/action-state"
import { ActionMessage, useFormAction } from "@/components/ui/action-controls"
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
import { PendingButton } from "@/components/ui/pending-button"
import { Select } from "@/components/ui/select"
import { PortalSection } from "@/components/portal/portal-section"

import { isoDay } from "../domain/dates"
import { PAYMENT_METHOD_LABELS } from "../domain/format"
import { PAYMENT_METHODS, type InvoiceStatus } from "../domain/schema"
import {
  chargeSavedCardAction,
  duplicateInvoiceAction,
  invoiceCommandAction,
  recordPaymentAction,
  sendReminderAction,
} from "../server/actions"
import { applyBalanceAction } from "../server/credit-actions"
import { resendInvoiceAction } from "../server/team-actions"

function RecordPaymentDialog({
  invoiceId,
  amountDue,
}: {
  invoiceId: string
  amountDue: string
}) {
  const [open, setOpen] = useState(false)
  const { state, pending, onSubmit } = useFormAction(
    recordPaymentAction.bind(null, invoiceId)
  )
  const today = isoDay(new Date())

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
        <form className="grid gap-4" onSubmit={onSubmit}>
          <ActionMessage state={state} />
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
              <Select {...control} name="method" defaultValue="bank_transfer">
                {PAYMENT_METHODS.filter((method) => method !== "credit").map(
                  (method) => (
                    <option key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </option>
                  )
                )}
              </Select>
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
          <PendingButton type="submit" pending={pending}>
            Record payment
          </PendingButton>
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
  creditBalance,
  savedCard = null,
}: {
  invoiceId: string
  status: InvoiceStatus
  publicUrl: string
  amountDue: string
  creditBalance: string | null
  /** e.g. "Visa ending 4242" when the client has autopay on. */
  savedCard?: string | null
}) {
  const [feedback, setFeedback] = useState<ActionState>(null)
  const [pending, startCommand] = useTransition()
  const open = status === "open"

  const command =
    (name: "void" | "uncollectible", confirmation?: string) => () => {
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
    <PortalSection title="Actions" className="print-hidden">
      <div className="grid gap-3">
        <ActionMessage state={feedback} />
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
              onClick={() =>
                startCommand(async () =>
                  setFeedback(await sendReminderAction(invoiceId))
                )
              }
            >
              Send reminder
            </Button>
            {savedCard ? (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      `Charge ${amountDue} to the client's ${savedCard} now?`
                    )
                  )
                    return
                  startCommand(async () =>
                    setFeedback(await chargeSavedCardAction(invoiceId))
                  )
                }}
              >
                <CreditCard className="size-4" aria-hidden="true" />
                Charge saved card
              </Button>
            ) : null}
            {creditBalance ? (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startCommand(async () =>
                    setFeedback(await applyBalanceAction(invoiceId))
                  )
                }
              >
                Apply credit balance ({creditBalance})
              </Button>
            ) : null}
          </>
        ) : null}
        {open || status === "uncollectible" ? (
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
    </PortalSection>
  )
}
