"use server"

import { revalidatePath } from "next/cache"
import { can } from "@/features/auth/domain/permissions"
import { requirePermission } from "@/features/auth/server/session"

import { needsOwnerApproval } from "../domain/credits"
import { parseMoneyInput } from "../domain/format"
import { CURRENCIES } from "../domain/schema"
import { credits } from "./billing"

type Outcome = { readonly ok: boolean; readonly message: string }

type CreditInput = {
  readonly amount: string
  readonly reason: string
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "")

const OWNER_ONLY =
  "Credit notes over $1,000 need the owner. Ask them to issue this one."

const readRequest = (input: CreditInput) => {
  const amount = parseMoneyInput(text(input.amount))
  const reason = text(input.reason).slice(0, 300)
  if (amount === null || amount <= 0) return "Enter a valid amount." as const
  if (!reason) return "Add a reason. It appears on the credit note." as const
  return { amount, reason }
}

const refresh = (path: string) => {
  revalidatePath(path)
  revalidatePath("/admin/billing/credit-notes")
  revalidatePath("/dashboard/billing")
}

export async function adjustInvoiceAction(
  invoiceId: string,
  input: CreditInput & { readonly kind: string }
): Promise<Outcome> {
  const admin = await requirePermission("billing:write")
  const request = readRequest(input)
  if (typeof request === "string") return { ok: false, message: request }
  if (
    needsOwnerApproval(request.amount) &&
    !can(admin.role, "billing:approve-credits")
  )
    return { ok: false, message: OWNER_ONLY }
  const refund = input.kind === "refund"
  const result = refund
    ? await credits.refundInvoice({ invoiceId, ...request }, admin.id)
    : await credits.creditInvoice({ invoiceId, ...request }, admin.id)
  refresh(`/admin/billing/invoices/${invoiceId}`)
  return result.ok
    ? {
        ok: true,
        message: refund
          ? `Refunded as ${result.value.number}. The card is credited in 5–10 days.`
          : `Credited as ${result.value.number}.`,
      }
    : { ok: false, message: result.error }
}

export async function creditBalanceAction(
  clientId: string,
  input: CreditInput & { readonly currency: string }
): Promise<Outcome> {
  const admin = await requirePermission("billing:write")
  const request = readRequest(input)
  if (typeof request === "string") return { ok: false, message: request }
  if (
    needsOwnerApproval(request.amount) &&
    !can(admin.role, "billing:approve-credits")
  )
    return { ok: false, message: OWNER_ONLY }
  const currency = CURRENCIES.find((value) => value === input.currency)
  if (!currency) return { ok: false, message: "Choose a currency." }
  const result = await credits.creditBalance(
    { clientId, currency, ...request },
    admin.id
  )
  refresh(`/admin/billing/clients/${clientId}`)
  return result.ok
    ? {
        ok: true,
        message: `Added as ${result.value.number}. It's applied to the next invoice automatically.`,
      }
    : { ok: false, message: result.error }
}

export async function applyBalanceAction(invoiceId: string): Promise<Outcome> {
  const admin = await requirePermission("billing:write")
  const result = await credits.applyBalance(invoiceId, admin.id)
  refresh(`/admin/billing/invoices/${invoiceId}`)
  return result.ok
    ? { ok: true, message: "Credit balance applied." }
    : { ok: false, message: result.error }
}
