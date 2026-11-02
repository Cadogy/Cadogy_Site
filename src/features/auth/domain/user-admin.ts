import { can, isStaff, type Role } from "./permissions"

export type UserAction =
  "ban" | "unban" | "revoke_sessions" | "reset_two_factor" | "impersonate"

type Member = { readonly id: string; readonly role: Role }

type Outcome =
  | { readonly ok: true; readonly value: null }
  | { readonly ok: false; readonly error: string }

const allowed: Outcome = { ok: true, value: null }
const denied = (error: string): Outcome => ({ ok: false, error })

const checkImpersonation = (actor: Member, target: Member) => {
  if (!can(actor.role, "security:impersonate"))
    return denied("Only an owner can view the portal as a client.")
  if (target.role !== "client")
    return denied("Only client accounts can be viewed this way.")
  return allowed
}

export const checkUserAction = ({
  actor,
  target,
  action,
}: {
  readonly actor: Member
  readonly target: Member
  readonly action: UserAction
}): Outcome => {
  if (actor.id === target.id)
    return denied("Use your own account settings for this.")
  if (action === "impersonate") return checkImpersonation(actor, target)
  if (!can(actor.role, "users:manage"))
    return denied("You don't have permission to manage users.")
  if (isStaff(target.role) && !can(actor.role, "users:assign-roles"))
    return denied("Only an owner can manage staff accounts.")
  if (action === "ban" && target.role === "owner")
    return denied("Owners can't be banned. Change their role first.")
  return allowed
}

export const canDeleteAccount = ({
  role,
  openInvoices,
}: {
  readonly role: Role
  readonly openInvoices: number
}): Outcome => {
  if (role !== "client")
    return denied(
      "Staff accounts are removed by an owner. Ask them to change your role first."
    )
  if (openInvoices > 0)
    return denied(
      `Please pay your ${openInvoices} open ${openInvoices === 1 ? "invoice" : "invoices"} before deleting your account.`
    )
  return allowed
}
