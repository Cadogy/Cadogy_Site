"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  isImpersonating,
  requirePermission,
} from "@/features/auth/server/session"

import { parseMoneyInput } from "../domain/format"
import type { Result } from "../domain/invoice"
import { billing } from "./billing"
import { createInvoiceCheckout, isStripeConfigured } from "./stripe"

export type ActionState = {
  readonly ok: boolean
  readonly message: string
} | null

const toState = <T>(result: Result<T>, success: string): ActionState =>
  result.ok
    ? { ok: true, message: success }
    : { ok: false, message: result.error }

const refreshBilling = (invoiceId?: string) => {
  revalidatePath("/admin")
  revalidatePath("/admin/billing/invoices")
  revalidatePath("/admin/billing/clients")
  revalidatePath("/dashboard/billing")
  if (invoiceId) revalidatePath(`/admin/billing/invoices/${invoiceId}`)
}

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim()

const clientFromForm = (formData: FormData) => ({
  name: text(formData, "name"),
  company: text(formData, "company"),
  email: text(formData, "email"),
  address: {
    line1: text(formData, "line1"),
    line2: text(formData, "line2"),
    city: text(formData, "city"),
    region: text(formData, "region"),
    postalCode: text(formData, "postalCode"),
    country: text(formData, "country"),
  },
  taxId: text(formData, "taxId"),
  currency: text(formData, "currency") || "USD",
  defaultTermsDays: Number(text(formData, "defaultTermsDays") || 15),
  notes: text(formData, "notes"),
})

export async function saveClientAction(
  clientId: string | null,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const input = clientFromForm(formData)
  const result = clientId
    ? await billing.updateClient(clientId, input)
    : await billing.createClient(input)
  if (!result.ok) return { ok: false, message: result.error }
  refreshBilling()
  if (!clientId) redirect(`/admin/billing/clients/${result.value.id}`)
  return { ok: true, message: "Client saved." }
}

export async function setClientArchivedAction(
  clientId: string,
  archived: boolean
) {
  await requirePermission("billing:write")
  const result = archived
    ? await billing.archiveClient(clientId)
    : await billing.restoreClient(clientId)
  refreshBilling()
  return toState(result, archived ? "Client archived." : "Client restored.")
}

export async function createDraftAction(clientId: string): Promise<void> {
  const admin = await requirePermission("billing:write")
  const result = await billing.createDraft({ clientId }, admin.id)
  if (!result.ok) throw new Error(result.error)
  refreshBilling()
  redirect(`/admin/billing/invoices/${result.value.id}`)
}

export async function saveDraftAction(
  invoiceId: string,
  draft: unknown
): Promise<ActionState> {
  const admin = await requirePermission("billing:write")
  const result = await billing.updateDraftInvoice(invoiceId, draft, admin.id)
  refreshBilling(invoiceId)
  return toState(result, "Draft saved.")
}

export async function issueInvoiceAction(
  invoiceId: string,
  draft: unknown
): Promise<ActionState> {
  const admin = await requirePermission("billing:write")
  const saved = await billing.updateDraftInvoice(invoiceId, draft, admin.id)
  if (!saved.ok) return { ok: false, message: saved.error }
  const result = await billing.issue(invoiceId, admin.id)
  refreshBilling(invoiceId)
  return toState(result, "Invoice issued and emailed to the client.")
}

export async function deleteDraftAction(invoiceId: string) {
  await requirePermission("billing:write")
  const result = await billing.deleteDraft(invoiceId)
  if (!result.ok)
    return { ok: false, message: result.error } satisfies ActionState
  refreshBilling()
  redirect("/admin/billing/invoices")
}

export async function recordPaymentAction(
  invoiceId: string,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requirePermission("billing:write")
  const amount = parseMoneyInput(text(formData, "amount"))
  if (amount === null || amount <= 0)
    return { ok: false, message: "Enter a valid amount." }
  const result = await billing.recordPayment(
    invoiceId,
    {
      amount,
      method: text(formData, "method"),
      reference: text(formData, "reference"),
      paidAt: text(formData, "paidAt") || new Date().toISOString(),
    },
    admin.id
  )
  refreshBilling(invoiceId)
  return toState(result, "Payment recorded.")
}

const INVOICE_COMMANDS = {
  remind: { run: billing.sendReminder, success: "Reminder sent." },
  void: { run: billing.voidInvoice, success: "Invoice voided." },
  uncollectible: {
    run: billing.markUncollectible,
    success: "Invoice marked uncollectible.",
  },
} as const

export async function invoiceCommandAction(
  invoiceId: string,
  command: keyof typeof INVOICE_COMMANDS
): Promise<ActionState> {
  const admin = await requirePermission("billing:write")
  const { run, success } = INVOICE_COMMANDS[command]
  const result = await run(invoiceId, admin.id)
  refreshBilling(invoiceId)
  return toState(result, success)
}

export async function duplicateInvoiceAction(invoiceId: string) {
  const admin = await requirePermission("billing:write")
  const result = await billing.duplicate(invoiceId, admin.id)
  if (!result.ok)
    return { ok: false, message: result.error } satisfies ActionState
  refreshBilling()
  redirect(`/admin/billing/invoices/${result.value.id}`)
}

export async function startCheckoutAction(token: string) {
  if (await isImpersonating())
    return {
      ok: false,
      message:
        "Payments are turned off while you're viewing the portal as a client.",
    } satisfies ActionState
  const invoice = await billing.getByPublicToken(token)
  const payable =
    invoice?.status === "open" || invoice?.status === "uncollectible"
  if (!invoice || !payable || !isStripeConfigured()) {
    return {
      ok: false,
      message: "Online payment isn't available for this invoice.",
    } satisfies ActionState
  }
  redirect(await createInvoiceCheckout(invoice))
}
