import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createGuards, type SessionUser } from "../application/guards"
import { isStaff, toRole } from "../domain/permissions"
import { auth } from "./auth"

const hasPasskey = async (requestHeaders: Headers) =>
  (await auth.api.listPasskeys({ headers: requestHeaders })).length > 0

const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) return null
  const role = toRole(session.user.role)
  const hasSecondFactor =
    Boolean(session.user.twoFactorEnabled) ||
    (isStaff(role) && (await hasPasskey(requestHeaders)))
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role,
    assurance: session.session.assurance === "multi" ? "multi" : "single",
    hasSecondFactor,
    impersonatedBy: session.session.impersonatedBy ?? null,
  }
})

export const { requireSession, requirePermission, requireStaff } = createGuards(
  { currentUser: getSessionUser, redirect }
)

export const isImpersonating = async () =>
  Boolean((await getSessionUser())?.impersonatedBy)

export const optionalSessionUser = getSessionUser
