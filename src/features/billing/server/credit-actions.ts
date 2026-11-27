"use server"

import { can, type Role } from "@/features/auth/domain/permissions"
import { requirePermission } from "@/features/auth/server/session"

import { toState, type ActionState } from "@/lib/action-state"

import { APPROVAL_WINDOW_DAYS, needsOwnerApproval } from "../domain/credits"
import { DAY_MS } from "../domain/dates"
import { parseMoneyInput } from "../domain/format"
import { CURRENCIES } from "../domain/schema"
import { billing, credits } from "./billing"
import { refreshBilling } from "./refresh"

type Outcome = NonNullable<ActionState>

type CreditInput = {
  readonly amount: string
  readonly reason: string
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "")

/** What the client was credited in the approval window, across every note. */
const recentlyCredited = async (clientId: string) => {
  const since = Date.now() - APPROVAL_WINDOW_DAYS * DAY_MS
  const notes = await credits.notesFor({ clientId })
  return notes
    .filter((note) => note.createdAt.getTime() >= since)
    .reduce((total, note) => total + note.amount, 0)
}

const readRequest = async (
  input: CreditInput,
  role: Role,
  clientId: string
) => {
  const amount = parseMoneyInput(text(input.amount))
  const reason = text(input.reason).slice(0, 300)
  if (amount === null || amount <= 0) return "Enter a valid amount."
  if (!reason) return "Add a reason. It appears on the credit note."
  if (
    !can(role, "billing:approve-credits") &&
    needsOwnerApproval(amount, await recentlyCredited(clientId))
  )
    return `Credits to one client over $1,000 in ${APPROVAL_WINDOW_DAYS} days need the owner. Ask them to issue this one.`
  return { amount, reason }
}

export async function adjustInvoiceAction(
  invoiceId: string,
  input: CreditInput & { readonly kind: string }
): Promise<Outcome> {
  const admin = await requirePermission("billing:write")
  const invoice = await billing.getInvoice(invoiceId)
  if (!invoice) return { ok: false, message: "Invoice not found." }
  const request = await readRequest(input, admin.role, invoice.clientId)
  if (typeof request === "string") return { ok: false, message: request }
  const refund = input.kind === "refund"
  const result = refund
    ? await credits.refundInvoice({ invoiceId, ...request }, admin.id)
    : await credits.creditInvoice({ invoiceId, ...request }, admin.id)
  refreshBilling({ invoiceId })
  if (!result.ok) return { ok: false, message: result.error }
  return {
    ok: true,
    message: refund
      ? `Refunded as ${result.value.number}. The card is credited in 5–10 days.`
      : `Credited as ${result.value.number}.`,
  }
}

export async function creditBalanceAction(
  clientId: string,
  input: CreditInput & { readonly currency: string }
): Promise<Outcome> {
  const admin = await requirePermission("billing:write")
  const request = await readRequest(input, admin.role, clientId)
  if (typeof request === "string") return { ok: false, message: request }
  const currency = CURRENCIES.find((value) => value === input.currency)
  if (!currency) return { ok: false, message: "Choose a currency." }
  const result = await credits.creditBalance(
    { clientId, currency, ...request },
    admin.id
  )
  refreshBilling({ clientId })
  if (!result.ok) return { ok: false, message: result.error }
  return {
    ok: true,
    message: `Added as ${result.value.number}. It's applied to the next invoice automatically.`,
  }
}

export async function applyBalanceAction(invoiceId: string): Promise<Outcome> {
  const admin = await requirePermission("billing:write")
  const result = await credits.applyBalance(invoiceId, admin.id)
  refreshBilling({ invoiceId })
  return toState(result, "Credit balance applied.")
}
