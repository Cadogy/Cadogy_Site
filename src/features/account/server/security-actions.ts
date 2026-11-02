"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/features/auth/server/auth"
import { requireSession } from "@/features/auth/server/session"
import { APIError } from "better-auth/api"

import { deletionEligibility } from "./security"

type ActionResult = { readonly ok: boolean; readonly message: string }

export async function revokeSessionAction(
  sessionId: string
): Promise<ActionResult> {
  await requireSession("/account/security")
  const requestHeaders = await headers()
  const sessions = await auth.api.listSessions({ headers: requestHeaders })
  const target = sessions.find((session) => session.id === sessionId)
  if (!target)
    return { ok: false, message: "That device is already signed out." }
  await auth.api.revokeSession({
    headers: requestHeaders,
    body: { token: target.token },
  })
  revalidatePath("/account/security")
  return { ok: true, message: "That device has been signed out." }
}

export async function revokeOtherSessionsAction(): Promise<ActionResult> {
  await requireSession("/account/security")
  await auth.api.revokeOtherSessions({ headers: await headers() })
  revalidatePath("/account/security")
  return { ok: true, message: "All other devices have been signed out." }
}

export async function requestAccountDeletionAction(): Promise<ActionResult> {
  const user = await requireSession("/account")
  if (user.impersonatedBy)
    return {
      ok: false,
      message: "You can't delete an account you're viewing as.",
    }
  const decision = await deletionEligibility(user)
  if (!decision.ok) return { ok: false, message: decision.error }
  try {
    await auth.api.deleteUser({
      headers: await headers(),
      body: { callbackURL: "/" },
    })
  } catch (error) {
    const fresh =
      error instanceof APIError && error.body?.code === "SESSION_EXPIRED"
    return {
      ok: false,
      message: fresh
        ? "For your security, sign out and sign back in, then try again within 10 minutes."
        : "We couldn't start deleting your account. Please try again.",
    }
  }
  return {
    ok: true,
    message: `We've emailed ${user.email} a link to confirm. It expires in an hour.`,
  }
}
