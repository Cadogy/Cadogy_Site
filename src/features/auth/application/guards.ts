import { can, isStaff, type Permission, type Role } from "../domain/permissions"

export type SessionUser = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: Role
}

type Dependencies = {
  readonly currentUser: () => Promise<SessionUser | null>
  readonly redirect: (location: string) => never
}

const loginPath = (returnTo: string) =>
  `/login?callbackUrl=${encodeURIComponent(returnTo)}`

export const createGuards = ({ currentUser, redirect }: Dependencies) => {
  const requireSession = async (returnTo = "/dashboard") =>
    (await currentUser()) ?? redirect(loginPath(returnTo))

  const requirePermission = async (
    permission: Permission,
    returnTo = "/admin"
  ) => {
    const user = await requireSession(returnTo)
    if (can(user.role, permission)) return user
    return redirect(isStaff(user.role) ? "/admin" : "/dashboard")
  }

  const requireStaff = async (returnTo = "/admin") => {
    const user = await requireSession(returnTo)
    return isStaff(user.role) ? user : redirect("/dashboard")
  }

  return { currentUser, requireSession, requirePermission, requireStaff }
}
