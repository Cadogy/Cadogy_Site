import "server-only"

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "./auth-options"

export type SessionUser = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: "user" | "admin"
}

const getSessionUser = async (): Promise<SessionUser | null> => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role === "admin" ? "admin" : "user",
  }
}

export const requireUser = async (returnTo = "/dashboard") => {
  const user = await getSessionUser()
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`)
  return user
}

export const requireAdmin = async () => {
  const user = await requireUser("/admin")
  if (user.role !== "admin") redirect("/dashboard")
  return user
}
