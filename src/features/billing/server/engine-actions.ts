"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  requirePermission,
  requireSession,
} from "@/features/auth/server/session"

import { parseMoneyInput } from "../domain/format"
import type { Result } from "../domain/invoice"
import type { AddOnStatus } from "../domain/recurring"
import type { ActionState } from "./actions"
import { billing, billingEngine } from "./billing"
import {
  createBatchCheckout,
  createCardSetupCheckout,
  isStripeConfigured,
} from "./stripe"

const toState = <T>(result: Result<T>, success: string): ActionState =>
  result.ok
    ? { ok: true, message: success }
    : { ok: false, message: result.error }

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim()

const optionalText = (formData: FormData, key: string) =>
  text(formData, key) || undefined

const money = (formData: FormData, key: string) =>
  parseMoneyInput(text(formData, key)) ?? undefined

const whole = (formData: FormData, key: string) => {
  const value = text(formData, key)
  return value ? Number(value) : undefined
}

const refresh = (clientId?: string) => {
  revalidatePath("/admin")
  revalidatePath("/admin/billing/catalog")
  revalidatePath("/admin/billing/invoices")
  revalidatePath("/admin/billing/settings")
  revalidatePath("/dashboard/billing")
  if (clientId) revalidatePath(`/admin/billing/clients/${clientId}`)
}

export async function saveCatalogItemAction(
  itemId: string | null,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const input = {
    name: text(formData, "name"),
    description: text(formData, "description"),
    unitAmount: money(formData, "price"),
    currency: text(formData, "currency") || "USD",
    interval: text(formData, "interval"),
  }
  const result = itemId
    ? await billingEngine.updateCatalogItem(itemId, input)
    : await billingEngine.createCatalogItem(input)
  refresh()
  return toState(
    result,
    itemId ? "Service updated." : "Service added to the catalog."
  )
}

export async function setCatalogItemArchivedAction(
  itemId: string,
  archived: boolean
) {
  await requirePermission("billing:write")
  const result = archived
    ? await billingEngine.archiveCatalogItem(itemId)
    : await billingEngine.restoreCatalogItem(itemId)
  refresh()
  return toState(result, archived ? "Service archived." : "Service restored.")
}

export async function addAddOnAction(
  clientId: string,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const result = await billingEngine.addAddOn(clientId, {
    catalogItemId: optionalText(formData, "catalogItemId"),
    name: optionalText(formData, "name"),
    unitAmount: money(formData, "price"),
    interval: optionalText(formData, "interval"),
    quantity: whole(formData, "quantity"),
    startDate: optionalText(formData, "startDate"),
  })
  refresh(clientId)
  return toState(result, "Service added. It bills on its start date.")
}

export async function updateAddOnAction(
  clientId: string,
  addOnId: string,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const result = await billingEngine.updateAddOn(addOnId, {
    quantity: whole(formData, "quantity"),
    unitAmount: money(formData, "price"),
  })
  refresh(clientId)
  return toState(
    result,
    "Service updated. Changes apply from the next renewal."
  )
}

const STATUS_MESSAGES: Record<AddOnStatus, string> = {
  active: "Service resumed.",
  paused: "Service paused. Skipped periods won't be billed.",
  canceled: "Service canceled. Nothing further will be billed.",
  completed: "Service completed.",
}

export async function setAddOnStatusAction(
  clientId: string,
  addOnId: string,
  status: AddOnStatus
) {
  await requirePermission("billing:write")
  const result = await billingEngine.setAddOnStatus(addOnId, status)
  refresh(clientId)
  return toState(result, STATUS_MESSAGES[status])
}

export async function addChargeAction(
  clientId: string,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const result = await billingEngine.addCharge(clientId, {
    description: text(formData, "description"),
    unitAmount: money(formData, "price"),
    quantity: whole(formData, "quantity"),
  })
  refresh(clientId)
  return toState(result, "Charge added. It goes on the next invoice.")
}

export async function voidChargeAction(clientId: string, chargeId: string) {
  await requirePermission("billing:write")
  const result = await billingEngine.voidCharge(chargeId)
  refresh(clientId)
  return toState(result, "Charge removed.")
}

export async function invoiceChargesAction(
  clientId: string,
  chargeIds: readonly string[] | "all"
): Promise<ActionState> {
  const admin = await requirePermission("billing:write")
  const result = await billingEngine.invoiceCharges(
    clientId,
    chargeIds,
    admin.id
  )
  refresh(clientId)
  if (!result.ok) return { ok: false, message: result.error }
  const count = result.value.length
  return {
    ok: true,
    message:
      count === 1
        ? "Invoice issued and emailed."
        : `${count} invoices issued and emailed.`,
  }
}

export async function setAutoBillAction(clientId: string, autoBill: boolean) {
  await requirePermission("billing:write")
  const result = await billing.setAutoBill(clientId, autoBill)
  refresh(clientId)
  return toState(
    result,
    autoBill
      ? "Charges will be invoiced automatically."
      : "Charges will wait for you to bill them."
  )
}

export async function removeCardAction(clientId: string) {
  await requirePermission("billing:write")
  const result = await billing.removeCard(clientId)
  refresh(clientId)
  return toState(result, "Saved card removed. Autopay is off.")
}

const offsetsFrom = (value: string) =>
  value
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number)

export async function saveBillingSettingsAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const taxPercent = Number(text(formData, "taxPercent") || 0)
  const result = await billingEngine.saveSettings({
    paymentInstructions: text(formData, "paymentInstructions"),
    defaultTaxRateBps: Math.round(taxPercent * 100),
    reminderOffsets: offsetsFrom(text(formData, "reminderOffsets")),
    autoBillEnabled: formData.get("autoBillEnabled") === "on",
  })
  refresh()
  return toState(result, "Billing settings saved.")
}

export async function runBillingNowAction(): Promise<ActionState> {
  await requirePermission("billing:write")
  const summary = await billingEngine.runBilling()
  refresh()
  return {
    ok: summary.errors.length === 0,
    message:
      summary.errors.length > 0
        ? `Run finished with errors: ${summary.errors.join("; ")}`
        : `Run finished: ${summary.invoicesIssued} invoices issued, ${summary.remindersSent} reminders sent.`,
  }
}

const IMPERSONATING: ActionState = {
  ok: false,
  message:
    "Billing actions are turned off while you're viewing the portal as a client.",
}

const UNAVAILABLE: ActionState = {
  ok: false,
  message:
    "Online payment isn't available right now. Use the payment instructions on your invoice.",
}

export async function payInvoicesAction(
  invoiceIds: readonly string[]
): Promise<ActionState> {
  const user = await requireSession("/dashboard/billing")
  if (user.impersonatedBy) return IMPERSONATING
  if (!isStripeConfigured()) return UNAVAILABLE
  const prepared = await billingEngine.preparePayment(user.email, invoiceIds)
  if (!prepared.ok) return { ok: false, message: prepared.error }
  redirect(await createBatchCheckout({ ...prepared.value, email: user.email }))
}

export async function saveCardForAutopayAction(
  clientId: string
): Promise<ActionState> {
  const user = await requireSession("/dashboard/billing")
  if (user.impersonatedBy) return IMPERSONATING
  if (!isStripeConfigured()) return UNAVAILABLE
  const client = (await billing.ownsClient(user.email, clientId))
    ? await billing.getClient(clientId)
    : null
  if (!client) return { ok: false, message: "Account not found." }
  redirect(await createCardSetupCheckout(client))
}

export async function setPortalAutopayAction(
  clientId: string,
  enabled: boolean
): Promise<ActionState> {
  const user = await requireSession("/dashboard/billing")
  if (user.impersonatedBy) return IMPERSONATING
  const result = await billing.setPortalAutopay(user.email, clientId, enabled)
  refresh(clientId)
  return toState(
    result,
    enabled
      ? "Autopay is on."
      : "Autopay is off. We'll email invoices for you to pay."
  )
}

export async function removePortalCardAction(
  clientId: string
): Promise<ActionState> {
  const user = await requireSession("/dashboard/billing")
  if (user.impersonatedBy) return IMPERSONATING
  if (!(await billing.ownsClient(user.email, clientId)))
    return { ok: false, message: "Account not found." }
  const result = await billing.removeCard(clientId)
  refresh(clientId)
  return toState(result, "Card removed. Autopay is off.")
}
