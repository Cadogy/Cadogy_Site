import { staffAccess, type Assurance } from "../domain/assurance"
import { can, isStaff, type Permission, type Role } from "../domain/permissions"

export type SessionUser = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: Role
  readonly assurance: Assurance
  readonly hasSecondFactor: boolean
}

type Dependencies = {
  readonly currentUser: () => Promise<SessionUser | null>
  readonly redirect: (location: string) => never
}

const loginPath = (returnTo: string) =>
  `/login?callbackUrl=${encodeURIComponent(returnTo)}`

const ENROLL_PATH = "/account/security?required=two-factor"

const reauthPath = (returnTo: string) =>
  `/login?reauth=1&callbackUrl=${encodeURIComponent(returnTo)}`

export const createGuards = ({ currentUser, redirect }: Dependencies) => {
  const requireSession = async (returnTo = "/dashboard") =>
    (await currentUser()) ?? redirect(loginPath(returnTo))

  const requireStrongStaffSession = (user: SessionUser, returnTo: string) => {
    const access = staffAccess(user)
    if (access === "enroll") return redirect(ENROLL_PATH)
    if (access === "reauthenticate") return redirect(reauthPath(returnTo))
    return user
  }

  const requirePermission = async (
    permission: Permission,
    returnTo = "/admin"
  ) => {
    const user = await requireSession(returnTo)
    if (!can(user.role, permission))
      return redirect(isStaff(user.role) ? "/admin" : "/dashboard")
    if (permission === "portal:self") return user
    return requireStrongStaffSession(user, returnTo)
  }

  const requireStaff = async (returnTo = "/admin") => {
    const user = await requireSession(returnTo)
    if (!isStaff(user.role)) return redirect("/dashboard")
    return requireStrongStaffSession(user, returnTo)
  }

  return { currentUser, requireSession, requirePermission, requireStaff }
}
