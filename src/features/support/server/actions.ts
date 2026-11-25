"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  requirePermission,
  requireSession,
} from "@/features/auth/server/session"

import { toState, type ActionState } from "@/lib/action-state"
import { isOneOf } from "@/lib/is-one-of"

import {
  TICKET_STATUSES,
  type TicketStatus,
} from "../application/support-service"
import { support } from "./support"

const refresh = (id?: string) => {
  revalidatePath("/dashboard/tickets")
  revalidatePath("/admin/tickets")
  if (id) {
    revalidatePath(`/dashboard/tickets/${id}`)
    revalidatePath(`/admin/tickets/${id}`)
  }
}

export async function openTicketAction(
  _previous: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireSession("/dashboard/tickets/new")
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
  const author =
    as === "admin"
      ? await requirePermission("support:write")
      : await requireSession(`/dashboard/tickets/${ticketId}`)
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
