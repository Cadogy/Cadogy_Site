"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
  isImpersonating,
  requirePermission,
} from "@/features/auth/server/session"

import { toState, type ActionState } from "@/lib/action-state"
import { TOO_MANY_REQUESTS, withinRateLimit } from "@/lib/rate-limit"
import { clientContext } from "@/lib/security/request-context"

import { parseMoneyInput } from "../domain/format"
import { wasDelivered } from "../domain/invoice"
import { isPayable } from "../domain/lifecycle"
import { calculateInvoiceTotals } from "../domain/totals"
import { billing, billingEngine } from "./billing"
import { text } from "./form-fields"
import { deliveryFeedback, issuedFeedback } from "./issue-feedback"
import { createInvoiceCheckout, isStripeConfigured } from "./stripe"

const refreshBilling = (invoiceId?: string) => {
  revalidatePath("/admin")
  revalidatePath("/admin/billing/invoices")
  revalidatePath("/admin/billing/clients")
  revalidatePath("/dashboard/billing")
  if (invoiceId) revalidatePath(`/admin/billing/invoices/${invoiceId}`)
}

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
    ? await billingEngine.archiveClient(clientId)
    : await billingEngine.restoreClient(clientId)
  refreshBilling()
  revalidatePath(`/admin/billing/clients/${clientId}`)
  return toState(
    result,
    archived
      ? "Client archived. Their services are paused and reminders stop."
      : "Client restored. Resume any paused services you want billed again."
  )
}

export async function createDraftAction(clientId: string): Promise<void> {
  const admin = await requirePermission("billing:write")
  const settings = await billingEngine.getSettings()
  const result = await billing.createDraft(
    {
      clientId,
      taxRateBps: settings.defaultTaxRateBps,
      memo: settings.paymentInstructions,
    },
    admin.id
  )
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
  const result = await billingEngine.issueAndCollect(invoiceId, admin.id)
  if (!result.ok) return { ok: false, message: result.error }
  refreshBilling(invoiceId)
  return issuedFeedback([result.value])
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
  void: { run: billing.voidInvoice, success: "Invoice voided." },
  uncollectible: {
    run: billing.markUncollectible,
    success: "Invoice marked uncollectible.",
  },
} as const

export async function sendReminderAction(
  invoiceId: string
): Promise<ActionState> {
  const admin = await requirePermission("billing:write")
  const result = await billing.sendReminder(invoiceId, admin.id)
  refreshBilling(invoiceId)
  if (!result.ok) return { ok: false, message: result.error }
  return deliveryFeedback(
    wasDelivered(result.value, "reminder_sent"),
    "Reminder sent."
  )
}

export async function chargeSavedCardAction(
  invoiceId: string
): Promise<ActionState> {
  await requirePermission("billing:write")
  const result = await billingEngine.chargeSavedCard(invoiceId)
  refreshBilling(invoiceId)
  if (!result.ok) return { ok: false, message: result.error }
  return result.value === "collected"
    ? { ok: true, message: "Saved card charged. The invoice is paid." }
    : {
        ok: false,
        message: "The saved card was declined. The client has been emailed.",
      }
}

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
  const settings = await billingEngine.getSettings()
  const result = await billing.duplicate(invoiceId, admin.id, {
    taxRateBps: settings.defaultTaxRateBps,
    memo: settings.paymentInstructions,
  })
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
  // Anyone with an invoice link can pay, so limit checkouts per network.
  const { ip } = clientContext(await headers())
  if (!(await withinRateLimit(`checkout:${ip || "unknown"}`, 20, 10 * 60_000)))
    return { ok: false, message: TOO_MANY_REQUESTS } satisfies ActionState
  const invoice = await billing.getByPublicToken(token)
  // Same rule as the page: open with something left to pay. A tab left open
  // after a payment or credit must not start a $0 checkout.
  const payable =
    invoice !== null &&
    isPayable(invoice) &&
    calculateInvoiceTotals(invoice).amountDue > 0
  if (!invoice || !payable || !isStripeConfigured()) {
    return {
      ok: false,
      message: "Online payment isn't available for this invoice.",
    } satisfies ActionState
  }
  redirect(await createInvoiceCheckout(invoice))
}
