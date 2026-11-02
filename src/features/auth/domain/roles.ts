import { can, type Role } from "./permissions"

type Member = { readonly id: string; readonly role: Role }

type Outcome =
  | { readonly ok: true; readonly value: null }
  | { readonly ok: false; readonly error: string }

const allowed: Outcome = { ok: true, value: null }
const denied = (error: string): Outcome => ({ ok: false, error })

export const checkRoleChange = ({
  actor,
  target,
  nextRole,
  ownerCount,
}: {
  readonly actor: Member
  readonly target: Member
  readonly nextRole: Role
  readonly ownerCount: number
}): Outcome => {
  if (!can(actor.role, "users:assign-roles"))
    return denied("Only an owner can change roles.")
  if (actor.id === target.id) return denied("You can't change your own role.")
  if (target.role === nextRole)
    return denied("This user already has that role.")
  if (target.role === "owner" && ownerCount <= 1)
    return denied("There must always be at least one owner.")
  return allowed
}

const normalize = (email: string | undefined) =>
  (email ?? "").trim().toLowerCase()

export const shouldBecomeOwner = ({
  email,
  emailVerified,
  ownerEmail,
  ownerExists,
}: {
  readonly email: string
  readonly emailVerified: boolean
  readonly ownerEmail: string | undefined
  readonly ownerExists: boolean
}) =>
  !ownerExists &&
  emailVerified &&
  normalize(ownerEmail) !== "" &&
  normalize(ownerEmail) === normalize(email)
