import "server-only"

import { revalidatePath } from "next/cache"

/** Every billing page that shows invoices, clients, credits or the catalog. */
const BILLING_PAGES = [
  "/admin",
  "/admin/billing/invoices",
  "/admin/billing/clients",
  "/admin/billing/catalog",
  "/admin/billing/settings",
  "/admin/billing/credit-notes",
  "/dashboard/billing",
  "/dashboard/team",
] as const

/**
 * After any billing change: the shared billing pages, plus the client's and
 * the invoice's own pages when given. Marking a page stale is cheap (it
 * re-renders on its next visit), so one complete list beats several partial
 * ones that can miss a page.
 */
export const refreshBilling = ({
  clientId,
  invoiceId,
}: { readonly clientId?: string; readonly invoiceId?: string } = {}) => {
  for (const page of BILLING_PAGES) revalidatePath(page)
  if (clientId) revalidatePath(`/admin/billing/clients/${clientId}`)
  if (invoiceId) revalidatePath(`/admin/billing/invoices/${invoiceId}`)
}
