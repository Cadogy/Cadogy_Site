"use server"

import {
  requirePermission,
  requireSession,
} from "@/features/auth/server/session"

import { toState, type ActionState } from "@/lib/action-state"
import { sendTeamInvite } from "@/lib/email"
import { TOO_MANY_REQUESTS, withinRateLimit } from "@/lib/rate-limit"

import type { TeamActor } from "../application/billing-service"
import type { ContactRole } from "../domain/contacts"
import { clientDisplayName } from "../domain/format"
import { wasDelivered } from "../domain/invoice"
import { accessRequests } from "./access"
import { billing } from "./billing"
import { deliveryFeedback } from "./issue-feedback"
import { refreshBilling } from "./refresh"

type ActionResult = NonNullable<ActionState>

type InviteInput = {
  readonly email: string
  readonly name: string
  readonly role: ContactRole
}

const VIEWING_AS_CLIENT: ActionResult = {
  ok: false,
  message: "Team changes are turned off while you're viewing as a client.",
}

const invite = async (
  clientId: string,
  input: InviteInput,
  actor: TeamActor
): Promise<ActionResult> => {
  const result = await billing.addContact(clientId, input, actor)
  if (!result.ok) return { ok: false, message: result.error }
  await sendTeamInvite(input.email.trim().toLowerCase(), {
    company: clientDisplayName(result.value),
    role: input.role,
  })
  refreshBilling({ clientId })
  return { ok: true, message: `Invited ${input.email}. We've emailed them.` }
}

const changeRole = async (
  clientId: string,
  email: string,
  role: ContactRole,
  actor: TeamActor
): Promise<ActionResult> => {
  const result = await billing.setContactRole(clientId, email, role, actor)
  refreshBilling({ clientId })
  return toState(result, "Access updated.")
}

const remove = async (
  clientId: string,
  email: string,
  actor: TeamActor
): Promise<ActionResult> => {
  const result = await billing.removeContact(clientId, email, actor)
  refreshBilling({ clientId })
  return toState(result, `Removed ${email}.`)
}

const contactActor = (user: {
  readonly email: string
  readonly impersonatedBy: string | null
}): TeamActor | null =>
  user.impersonatedBy ? null : { kind: "contact", email: user.email }

export async function inviteTeamContactAction(
  clientId: string,
  input: InviteInput
): Promise<ActionResult> {
  const user = await requireSession("/dashboard/team")
  const actor = contactActor(user)
  if (!actor) return VIEWING_AS_CLIENT
  if (!(await withinRateLimit(`team:invite:${user.id}`, 10, 60 * 60_000)))
    return { ok: false, message: TOO_MANY_REQUESTS }
  return invite(clientId, input, actor)
}

export async function setTeamContactRoleAction(
  clientId: string,
  email: string,
  role: ContactRole
): Promise<ActionResult> {
  const actor = contactActor(await requireSession("/dashboard/team"))
  return actor ? changeRole(clientId, email, role, actor) : VIEWING_AS_CLIENT
}

export async function removeTeamContactAction(
  clientId: string,
  email: string
): Promise<ActionResult> {
  const actor = contactActor(await requireSession("/dashboard/team"))
  return actor ? remove(clientId, email, actor) : VIEWING_AS_CLIENT
}

export async function inviteClientContactAction(
  clientId: string,
  input: InviteInput
): Promise<ActionResult> {
  const admin = await requirePermission("billing:write")
  return invite(clientId, input, { kind: "staff", id: admin.id })
}

export async function setClientContactRoleAction(
  clientId: string,
  email: string,
  role: ContactRole
): Promise<ActionResult> {
  const admin = await requirePermission("billing:write")
  return changeRole(clientId, email, role, { kind: "staff", id: admin.id })
}

export async function removeClientContactAction(
  clientId: string,
  email: string
): Promise<ActionResult> {
  const admin = await requirePermission("billing:write")
  return remove(clientId, email, { kind: "staff", id: admin.id })
}

export async function resendInvoiceAction(
  invoiceId: string
): Promise<ActionResult> {
  const admin = await requirePermission("billing:write")
  const result = await billing.resendInvoice(invoiceId, admin.id)
  refreshBilling({ invoiceId })
  if (!result.ok) return { ok: false, message: result.error }
  return deliveryFeedback(
    wasDelivered(result.value, "sent"),
    "Invoice sent to the billing contacts."
  )
}

export async function requestInvoiceAccessAction(
  invoiceToken: string
): Promise<ActionResult> {
  const user = await requireSession(`/invoice/${invoiceToken}`)
  if (user.impersonatedBy)
    return {
      ok: false,
      message:
        "Access requests are turned off while you're viewing as a client.",
    }
  if (!(await withinRateLimit(`access:request:${user.id}`, 5, 60 * 60_000)))
    return { ok: false, message: TOO_MANY_REQUESTS }
  const result = await accessRequests.request({
    invoiceToken,
    email: user.email,
    name: user.name,
  })
  if (!result.ok) return { ok: false, message: result.error }
  const messages = {
    already_contact: "This invoice is already in your account.",
    already_requested:
      "You've already asked. We'll email you as soon as it's approved.",
    requested:
      "Request sent. The account's billing contacts will review it, and we'll email you when it's approved.",
  } as const
  return { ok: true, message: messages[result.value] }
}

export async function decideInvoiceAccessAction(
  token: string,
  decision: "approve" | "decline"
): Promise<ActionResult> {
  const result = await accessRequests.decide(token, decision)
  if (!result.ok) return { ok: false, message: result.error }
  return {
    ok: true,
    message:
      result.value.decision === "approve"
        ? `${result.value.email} can now see ${result.value.company}'s invoices.`
        : "Request declined. Nothing has changed.",
  }
}
