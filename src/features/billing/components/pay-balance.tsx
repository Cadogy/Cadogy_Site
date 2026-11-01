"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { CreditCard, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { formatAmountsByCurrency, formatMoney } from "../domain/format"
import type { Currency } from "../domain/schema"
import type { ActionState } from "../server/actions"
import { ActionMessage } from "./action-controls"

export type PayableInvoice = {
  readonly id: string
  readonly number: string
  readonly amountDue: number
  readonly currency: Currency
  readonly dueLabel: string | null
  readonly overdue: boolean
  readonly href: string
}

const totalsOf = (invoices: readonly PayableInvoice[]) =>
  invoices.reduce<Partial<Record<Currency, number>>>(
    (totals, invoice) => ({
      ...totals,
      [invoice.currency]: (totals[invoice.currency] ?? 0) + invoice.amountDue,
    }),
    {}
  )

export function PayBalance({
  invoices,
  onPay,
  onlinePaymentAvailable,
}: {
  invoices: readonly PayableInvoice[]
  onPay: (invoiceIds: readonly string[]) => Promise<ActionState>
  onlinePaymentAvailable: boolean
}) {
  const [selected, setSelected] = useState<readonly string[]>(() =>
    invoices.map((invoice) => invoice.id)
  )
  const [state, setState] = useState<ActionState>(null)
  const [pending, start] = useTransition()

  const chosen = invoices.filter((invoice) => selected.includes(invoice.id))
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    )
  const pay = () =>
    start(async () =>
      setState(await onPay(chosen.map((invoice) => invoice.id)))
    )

  return (
    <div className="grid gap-5">
      <ul className="divide-y border-y">
        {invoices.map((invoice) => (
          <li key={invoice.id} className="flex items-center gap-3 py-2">
            <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="size-5 accent-foreground"
                checked={selected.includes(invoice.id)}
                onChange={() => toggle(invoice.id)}
                disabled={!onlinePaymentAvailable}
              />
              <span className="grid flex-1">
                <span className="font-medium">{invoice.number}</span>
                {invoice.dueLabel ? (
                  <span
                    className={
                      invoice.overdue
                        ? "text-sm text-warning"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {invoice.overdue
                      ? `Was due ${invoice.dueLabel}`
                      : `Due ${invoice.dueLabel}`}
                  </span>
                ) : null}
              </span>
              <span className="font-medium tabular-nums">
                {formatMoney(invoice.amountDue, invoice.currency)}
              </span>
            </label>
            <Link
              href={invoice.href}
              className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground hover:text-foreground"
            >
              View
            </Link>
          </li>
        ))}
      </ul>
      {onlinePaymentAvailable ? (
        <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
          <Button
            size="lg"
            onClick={pay}
            disabled={pending || chosen.length === 0}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CreditCard className="size-4" aria-hidden="true" />
            )}
            {chosen.length === 0
              ? "Select invoices to pay"
              : `Pay ${formatAmountsByCurrency(totalsOf(chosen))}`}
          </Button>
          <p className="text-sm text-muted-foreground">
            Secure card payment by Stripe. One payment covers every selected
            invoice.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Use the payment instructions on each invoice, or reply to the invoice
          email.
        </p>
      )}
      <ActionMessage state={state} />
    </div>
  )
}
