"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  requirePermission,
  requireSession,
} from "@/features/auth/server/session"

import { toState, type ActionState } from "@/lib/action-state"
import { isOneOf } from "@/lib/is-one-of"
import { TOO_MANY_REQUESTS, withinRateLimit } from "@/lib/rate-limit"

import {
  TICKET_STATUSES,
  type TicketStatus,
} from "../application/support-service"
import { support } from "./support"

const isReplyAuthor = isOneOf(["user", "admin"] as const)

const refresh = (id?: string) => {
  revalidatePath("/dashboard/tickets")
  revalidatePath("/admin/tickets")
  if (id) {
    revalidatePath(`/dashboard/tickets/${id}`)
    revalidatePath(`/admin/tickets/${id}`)
  }
}

// Staff viewing the portal as a client reply from the admin, as themselves.
const VIEWING_AS_CLIENT: ActionState = {
  ok: false,
  message:
    "Support requests can't be sent while you're viewing as a client. Reply from the admin instead.",
}

export async function openTicketAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireSession("/dashboard/tickets/new")
  if (user.impersonatedBy) return VIEWING_AS_CLIENT
  if (!(await withinRateLimit(`ticket:open:${user.id}`, 5, 60 * 60_000)))
    return { ok: false, message: TOO_MANY_REQUESTS }
  const result = await support.open(user, Object.fromEntries(formData))
  if (!result.ok) return { ok: false, message: result.error }
  refresh()
  redirect(`/dashboard/tickets/${result.value.id}`)
}

export async function replyToTicketAction(
  ticketId: string,
  as: "user" | "admin",
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!isReplyAuthor(as))
    return { ok: false, message: "Reply could not be sent." }
  const author =
    as === "admin"
      ? await requirePermission("support:write")
      : await requireSession(`/dashboard/tickets/${ticketId}`)
  if (as === "user" && author.impersonatedBy) return VIEWING_AS_CLIENT
  if (
    as === "user" &&
    !(await withinRateLimit(`ticket:reply:${author.id}`, 30, 60 * 60_000))
  )
    return { ok: false, message: TOO_MANY_REQUESTS }
  const result = await support.reply(
    author,
    ticketId,
    String(formData.get("message") ?? ""),
    as
  )
  refresh(ticketId)
  return toState(result, "Reply sent.")
}

export async function setTicketStatusAction(
  ticketId: string,
  status: TicketStatus
) {
  await requirePermission("support:write")
  if (!isOneOf(TICKET_STATUSES)(status)) return
  await support.setStatus(ticketId, status)
  refresh(ticketId)
}
