"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, Send, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { PortalSection } from "@/components/portal/portal-section"

import { formatMoney } from "../domain/format"
import { CURRENCIES } from "../domain/schema"
import { calculateInvoiceTotals } from "../domain/totals"
import {
  deleteDraftAction,
  issueInvoiceAction,
  saveDraftAction,
  type ActionState,
} from "../server/actions"
import {
  editorToDraft,
  type EditorLine,
  type EditorState,
} from "./editor-model"

type ClientOption = { readonly id: string; readonly label: string }

const newLine = (): EditorLine => ({
  key: crypto.randomUUID(),
  description: "",
  quantity: "1",
  unitPrice: "",
})

export function InvoiceEditor({
  invoiceId,
  initial,
  clients,
}: {
  invoiceId: string
  initial: EditorState
  clients: readonly ClientOption[]
}) {
  const [state, setState] = useState<EditorState>(
    initial.lineItems.length > 0
      ? initial
      : { ...initial, lineItems: [newLine()] }
  )
  const [feedback, setFeedback] = useState<ActionState>(null)
  const [pending, startTransition] = useTransition()

  const draft = editorToDraft(state)
  const totals = draft.ok
    ? calculateInvoiceTotals({ ...draft.value, payments: [] })
    : null
  const money = (amount: number) => formatMoney(amount, state.currency)

  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) =>
    setState((current) => ({ ...current, [key]: value }))

  const updateLine = (
    key: string,
    field: keyof Omit<EditorLine, "key">,
    value: string
  ) =>
    setState((current) => ({
      ...current,
      lineItems: current.lineItems.map((line) =>
        line.key === key ? { ...line, [field]: value } : line
      ),
    }))

  const removeLine = (key: string) =>
    setState((current) => ({
      ...current,
      lineItems: current.lineItems.filter((line) => line.key !== key),
    }))

  const run = (action: (payload: unknown) => Promise<ActionState>) => {
    if (!draft.ok) {
      setFeedback({ ok: false, message: draft.error })
      return
    }
    startTransition(async () => setFeedback(await action(draft.value)))
  }

  const confirmIssue = () => {
    if (
      window.confirm(
        "Issue this invoice and email it to the client? It can't be edited afterwards."
      )
    ) {
      run((payload) => issueInvoiceAction(invoiceId, payload))
    }
  }

  const confirmDelete = () => {
    if (window.confirm("Delete this draft permanently?")) {
      startTransition(async () => {
        const result = await deleteDraftAction(invoiceId)
        if (result) setFeedback(result)
      })
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
      <div className="grid gap-12">
        <PortalSection title="Details">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="clientId" label="Client" className="sm:col-span-3">
              {(control) => (
                <NativeSelect
                  {...control}
                  value={state.clientId}
                  onChange={(event) => update("clientId", event.target.value)}
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.label}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <Field id="currency" label="Currency">
              {(control) => (
                <NativeSelect
                  {...control}
                  value={state.currency}
                  onChange={(event) =>
                    update(
                      "currency",
                      event.target.value as EditorState["currency"]
                    )
                  }
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency}>{currency}</option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <Field id="termsDays" label="Payment terms (days)">
              {(control) => (
                <Input
                  {...control}
                  inputMode="numeric"
                  value={state.termsDays}
                  onChange={(event) => update("termsDays", event.target.value)}
                />
              )}
            </Field>
            <Field id="taxRate" label="Tax rate (%)" optional>
              {(control) => (
                <Input
                  {...control}
                  inputMode="decimal"
                  value={state.taxRate}
                  onChange={(event) => update("taxRate", event.target.value)}
                />
              )}
            </Field>
          </div>
        </PortalSection>

        <PortalSection title="Line items">
          <div className="hidden grid-cols-[1fr_90px_140px_44px] gap-3 pb-3 text-meta md:grid">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span className="sr-only">Remove</span>
          </div>
          <ol className="grid gap-4 md:gap-3 md:pb-4">
            {state.lineItems.map((line, index) => (
              <li
                key={line.key}
                className="grid grid-cols-2 gap-3 border-t pt-4 md:grid-cols-[1fr_90px_140px_44px] md:items-start md:border-0 md:pt-0"
              >
                <div className="col-span-2 grid gap-1.5 md:col-span-1">
                  <Label
                    htmlFor={`${line.key}-description`}
                    className="md:sr-only"
                  >
                    Line {index + 1} description
                  </Label>
                  <Textarea
                    id={`${line.key}-description`}
                    rows={1}
                    className="min-h-11 py-2.5"
                    value={line.description}
                    onChange={(event) =>
                      updateLine(line.key, "description", event.target.value)
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label
                    htmlFor={`${line.key}-quantity`}
                    className="md:sr-only"
                  >
                    Quantity
                  </Label>
                  <Input
                    id={`${line.key}-quantity`}
                    inputMode="decimal"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.key, "quantity", event.target.value)
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`${line.key}-price`} className="md:sr-only">
                    Unit price
                  </Label>
                  <Input
                    id={`${line.key}-price`}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={line.unitPrice}
                    onChange={(event) =>
                      updateLine(line.key, "unitPrice", event.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-span-2 justify-self-end md:col-span-1"
                  aria-label={`Remove line ${index + 1}`}
                  onClick={() => removeLine(line.key)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={() => update("lineItems", [...state.lineItems, newLine()])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add line
          </Button>
        </PortalSection>

        <PortalSection title="Discount and notes">
          <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
            <Field id="discountType" label="Discount">
              {(control) => (
                <NativeSelect
                  {...control}
                  value={state.discountType}
                  onChange={(event) =>
                    update(
                      "discountType",
                      event.target.value as EditorState["discountType"]
                    )
                  }
                >
                  <option value="none">No discount</option>
                  <option value="percent">Percentage</option>
                  <option value="amount">Fixed amount</option>
                </NativeSelect>
              )}
            </Field>
            {state.discountType !== "none" ? (
              <Field
                id="discountValue"
                label={
                  state.discountType === "percent"
                    ? "Discount (%)"
                    : `Discount (${state.currency})`
                }
              >
                {(control) => (
                  <Input
                    {...control}
                    inputMode="decimal"
                    value={state.discountValue}
                    onChange={(event) =>
                      update("discountValue", event.target.value)
                    }
                  />
                )}
              </Field>
            ) : null}
          </div>
          <Field
            id="memo"
            label="Note to client"
            optional
            hint="Shown on the invoice, e.g. payment instructions."
          >
            {(control) => (
              <Textarea
                {...control}
                rows={3}
                value={state.memo}
                onChange={(event) => update("memo", event.target.value)}
              />
            )}
          </Field>
          <Field id="footer" label="Footer" optional>
            {(control) => (
              <Input
                {...control}
                value={state.footer}
                onChange={(event) => update("footer", event.target.value)}
              />
            )}
          </Field>
          <Field
            id="internalNotes"
            label="Internal notes"
            optional
            hint="Only visible to admins."
          >
            {(control) => (
              <Textarea
                {...control}
                rows={2}
                value={state.internalNotes}
                onChange={(event) =>
                  update("internalNotes", event.target.value)
                }
              />
            )}
          </Field>
        </PortalSection>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="grid gap-4 panel">
          <h2 className="text-lg font-medium">Summary</h2>
          {totals ? (
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{money(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount</dt>
                <dd>−{money(totals.discount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax</dt>
                <dd>{money(totals.tax)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-medium">
                <dt>Total</dt>
                <dd>{money(totals.total)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              {!draft.ok ? draft.error : null}
            </p>
          )}

          {feedback ? (
            <p
              role={feedback.ok ? "status" : "alert"}
              className={
                feedback.ok
                  ? "text-sm text-success"
                  : "text-sm text-destructive"
              }
            >
              {feedback.message}
            </p>
          ) : null}

          <div className="grid gap-2">
            <Button onClick={confirmIssue} disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              Issue and send
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                run((payload) => saveDraftAction(invoiceId, payload))
              }
            >
              Save draft
            </Button>
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={pending}
              onClick={confirmDelete}
            >
              Delete draft
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}
