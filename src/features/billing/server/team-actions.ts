"use server"

import { revalidatePath } from "next/cache"
import {
  requirePermission,
  requireSession,
} from "@/features/auth/server/session"

import { sendTeamInvite } from "@/lib/email"

import type { TeamActor } from "../application/billing-service"
import type { ContactRole } from "../domain/contacts"
import { accessRequests } from "./access"
import { billing } from "./billing"

type ActionResult = { readonly ok: boolean; readonly message: string }

type InviteInput = {
  readonly email: string
  readonly name: string
  readonly role: ContactRole
}

const VIEWING_AS_CLIENT: ActionResult = {
  ok: false,
  message: "Team changes are turned off while you're viewing as a client.",
}

const refresh = (clientId: string) => {
  revalidatePath("/dashboard/team")
  revalidatePath(`/admin/billing/clients/${clientId}`)
}

const invite = async (
  clientId: string,
  input: InviteInput,
  actor: TeamActor
): Promise<ActionResult> => {
  const result = await billing.addContact(clientId, input, actor)
  if (!result.ok) return { ok: false, message: result.error }
  await sendTeamInvite(input.email.trim().toLowerCase(), {
    company: result.value.company || result.value.name,
    role: input.role,
  })
  refresh(clientId)
  return { ok: true, message: `Invited ${input.email}. We've emailed them.` }
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
  const actor = contactActor(await requireSession("/dashboard/team"))
  return actor ? invite(clientId, input, actor) : VIEWING_AS_CLIENT
}

export async function setTeamContactRoleAction(
  clientId: string,
  email: string,
  role: ContactRole
): Promise<ActionResult> {
  const actor = contactActor(await requireSession("/dashboard/team"))
  if (!actor) return VIEWING_AS_CLIENT
  const result = await billing.setContactRole(clientId, email, role, actor)
  refresh(clientId)
  return result.ok
    ? { ok: true, message: "Access updated." }
    : { ok: false, message: result.error }
}

export async function removeTeamContactAction(
  clientId: string,
  email: string
): Promise<ActionResult> {
  const actor = contactActor(await requireSession("/dashboard/team"))
  if (!actor) return VIEWING_AS_CLIENT
  const result = await billing.removeContact(clientId, email, actor)
  refresh(clientId)
  return result.ok
    ? { ok: true, message: `Removed ${email}.` }
    : { ok: false, message: result.error }
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
  const actor: TeamActor = { kind: "staff", id: admin.id }
  const result = await billing.setContactRole(clientId, email, role, actor)
  refresh(clientId)
  return result.ok
    ? { ok: true, message: "Access updated." }
    : { ok: false, message: result.error }
}

export async function removeClientContactAction(
  clientId: string,
  email: string
): Promise<ActionResult> {
  const admin = await requirePermission("billing:write")
  const actor: TeamActor = { kind: "staff", id: admin.id }
  const result = await billing.removeContact(clientId, email, actor)
  refresh(clientId)
  return result.ok
    ? { ok: true, message: `Removed ${email}.` }
    : { ok: false, message: result.error }
}

export async function resendInvoiceAction(
  invoiceId: string
): Promise<ActionResult> {
  const admin = await requirePermission("billing:write")
  const result = await billing.resendInvoice(invoiceId, admin.id)
  revalidatePath(`/admin/billing/invoices/${invoiceId}`)
  return result.ok
    ? { ok: true, message: "Invoice sent to the billing contacts." }
    : { ok: false, message: result.error }
}

export async function requestInvoiceAccessAction(
  invoiceToken: string
): Promise<ActionResult> {
  const user = await requireSession(`/invoice/${invoiceToken}`)
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
