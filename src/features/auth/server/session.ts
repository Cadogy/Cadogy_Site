import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createGuards, type SessionUser } from "../application/guards"
import { toRole } from "../domain/permissions"
import { auth } from "./auth"

const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: toRole(session.user.role),
  }
})

export const { requireSession, requirePermission, requireStaff } = createGuards(
  { currentUser: getSessionUser, redirect }
)
