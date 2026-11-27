"use server"

import { redirect } from "next/navigation"
import {
  requirePermission,
  requireSession,
} from "@/features/auth/server/session"

import { toState, type ActionState } from "@/lib/action-state"

import { loggedTimeMessage } from "../application/engine"
import { parsePercentToBps } from "../domain/format"
import type { AddOnStatus } from "../domain/recurring"
import { billing, billingEngine } from "./billing"
import {
  money,
  optionalDecimal,
  optionalMoney,
  optionalText,
  text,
  whole,
} from "./form-fields"
import { issuedFeedback } from "./issue-feedback"
import { refreshBilling } from "./refresh"
import {
  createBatchCheckout,
  createCardSetupCheckout,
  isStripeConfigured,
} from "./stripe"

const INVALID_PRICE: ActionState = {
  ok: false,
  message: "Enter a valid price, e.g. 150.00",
}

export async function saveCatalogItemAction(
  itemId: string | null,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const price = optionalMoney(formData, "price")
  if (!price.ok) return INVALID_PRICE
  const input = {
    name: text(formData, "name"),
    description: text(formData, "description"),
    categoryId: optionalText(formData, "categoryId") ?? null,
    pricing: text(formData, "pricing") || "fixed",
    unitAmount: price.value,
    unit: optionalText(formData, "unit") ?? null,
    priceFrom: formData.get("priceFrom") === "on",
    includedItemIds: formData
      .getAll("includedItemIds")
      .map(String)
      .filter(Boolean),
    includedHours: optionalDecimal(formData, "includedHours"),
    currency: text(formData, "currency") || "USD",
    interval: text(formData, "interval"),
  }
  const result = itemId
    ? await billingEngine.updateCatalogItem(itemId, input)
    : await billingEngine.createCatalogItem(input)
  refreshBilling()
  return toState(
    result,
    itemId ? "Service updated." : "Service added to the catalog."
  )
}

const rateFrom = (formData: FormData) => {
  const rate = optionalMoney(formData, "hourlyRate")
  if (!rate.ok) return rate
  return {
    ok: true as const,
    value:
      rate.value === null
        ? null
        : { amount: rate.value, currency: text(formData, "currency") || "USD" },
  }
}

export async function saveCategoryAction(
  categoryId: string | null,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const hourlyRate = rateFrom(formData)
  if (!hourlyRate.ok) return INVALID_PRICE
  const input = { name: text(formData, "name"), hourlyRate: hourlyRate.value }
  const result = categoryId
    ? await billingEngine.updateCategory(categoryId, input)
    : await billingEngine.createCategory(input)
  refreshBilling()
  return toState(result, categoryId ? "Category updated." : "Category added.")
}

export async function deleteCategoryAction(categoryId: string) {
  await requirePermission("billing:write")
  const result = await billingEngine.deleteCategory(categoryId)
  refreshBilling()
  return toState(
    result,
    "Category deleted. Its services are now uncategorized."
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
  refreshBilling()
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
  refreshBilling({ clientId })
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
    name: optionalText(formData, "name"),
    quantity: whole(formData, "quantity"),
    unitAmount: money(formData, "price"),
    interval: optionalText(formData, "interval"),
    nextBillingDate: optionalText(formData, "nextBillingDate"),
    ...(formData.has("includedHours")
      ? { includedHours: optionalDecimal(formData, "includedHours") }
      : {}),
  })
  refreshBilling({ clientId })
  return toState(
    result,
    "Service updated. Price and quantity changes apply from the next renewal."
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
  refreshBilling({ clientId })
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
  refreshBilling({ clientId })
  return toState(result, "Charge added. It goes on the next invoice.")
}

export async function logTimeAction(
  clientId: string,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const rate = optionalMoney(formData, "rate")
  if (!rate.ok) return INVALID_PRICE
  const result = await billingEngine.logTime(clientId, {
    date: text(formData, "date"),
    hours: optionalDecimal(formData, "hours") ?? undefined,
    description: text(formData, "description"),
    catalogItemId: optionalText(formData, "catalogItemId"),
    unitAmount: rate.value ?? undefined,
    billSeparately: formData.get("billSeparately") === "on",
  })
  refreshBilling({ clientId })
  if (!result.ok) return { ok: false, message: result.error }
  return { ok: true, message: loggedTimeMessage(result.value) }
}

export async function removeTimeEntryAction(
  clientId: string,
  entryId: string
): Promise<ActionState> {
  await requirePermission("billing:write")
  const result = await billingEngine.removeTimeEntry(entryId)
  refreshBilling({ clientId })
  return toState(result, "Time entry removed.")
}

export async function updateChargeAction(
  clientId: string,
  chargeId: string,
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requirePermission("billing:write")
  const result = await billingEngine.updateCharge(chargeId, {
    description: text(formData, "description"),
    unitAmount: money(formData, "price"),
    quantity: whole(formData, "quantity"),
  })
  refreshBilling({ clientId })
  return toState(result, "Charge updated.")
}

export async function voidChargeAction(clientId: string, chargeId: string) {
  await requirePermission("billing:write")
  const result = await billingEngine.voidCharge(chargeId)
  refreshBilling({ clientId })
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
  refreshBilling({ clientId })
  if (!result.ok) return { ok: false, message: result.error }
  return issuedFeedback(result.value)
}

export async function setAutoBillAction(clientId: string, autoBill: boolean) {
  await requirePermission("billing:write")
  const result = await billing.setAutoBill(clientId, autoBill)
  refreshBilling({ clientId })
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
  refreshBilling({ clientId })
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
  const defaultTaxRateBps = parsePercentToBps(text(formData, "taxPercent"))
  if (defaultTaxRateBps === null)
    return { ok: false, message: "Enter a tax rate between 0 and 100." }
  const defaultHourlyRate = rateFrom(formData)
  if (!defaultHourlyRate.ok) return INVALID_PRICE
  const result = await billingEngine.saveSettings({
    paymentInstructions: text(formData, "paymentInstructions"),
    defaultTaxRateBps,
    reminderOffsets: offsetsFrom(text(formData, "reminderOffsets")),
    autoBillEnabled: formData.get("autoBillEnabled") === "on",
    defaultHourlyRate: defaultHourlyRate.value,
  })
  refreshBilling()
  return toState(result, "Billing settings saved.")
}

export async function runBillingNowAction(): Promise<ActionState> {
  await requirePermission("billing:write")
  const summary = await billingEngine.runBilling()
  refreshBilling()
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
  const allowed = await billing.requireBillingContact(user.email, clientId)
  if (!allowed.ok) return { ok: false, message: allowed.error }
  const client = await billing.getClient(clientId)
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
  refreshBilling({ clientId })
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
  const allowed = await billing.requireBillingContact(user.email, clientId)
  if (!allowed.ok) return { ok: false, message: allowed.error }
  const result = await billing.removeCard(clientId)
  refreshBilling({ clientId })
  return toState(result, "Card removed. Autopay is off.")
}
