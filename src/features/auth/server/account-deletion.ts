import "server-only"

import { billing } from "@/features/billing/server/billing"

import { isStaff, type Role } from "../domain/permissions"
import { canDeleteAccount } from "../domain/user-admin"

const openInvoicesFor = async (email: string) =>
  (await billing.listForPortalUser(email)).filter(
    (invoice) => invoice.status === "open"
  ).length

export const deletionEligibility = async (user: {
  readonly email: string
  readonly role: Role
}) =>
  canDeleteAccount({
    role: user.role,
    openInvoices: isStaff(user.role) ? 0 : await openInvoicesFor(user.email),
  })
