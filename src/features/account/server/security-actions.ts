"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth } from "@/features/auth/server/auth"
import { requireSession } from "@/features/auth/server/session"

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
