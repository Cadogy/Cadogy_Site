"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { deletionEligibility } from "@/features/auth/server/account-deletion"
import { auth } from "@/features/auth/server/auth"
import { requireSession } from "@/features/auth/server/session"
import { APIError } from "better-auth/api"

type ActionResult = { readonly ok: boolean; readonly message: string }

// Staff viewing the portal as a client mustn't sign the client out.
const VIEWING_AS_CLIENT: ActionResult = {
  ok: false,
  message: "Device sign-out is turned off while you're viewing as a client.",
}

export async function revokeSessionAction(
  sessionId: string
): Promise<ActionResult> {
  const user = await requireSession("/account/security")
  if (user.impersonatedBy) return VIEWING_AS_CLIENT
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
  const user = await requireSession("/account/security")
  if (user.impersonatedBy) return VIEWING_AS_CLIENT
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
