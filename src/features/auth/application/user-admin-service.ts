import type { Role } from "../domain/permissions"
import type { SecurityEventType } from "../domain/security-events"
import { checkUserAction, type UserAction } from "../domain/user-admin"
import type { createSecurityLog } from "./security-log"

type ManagedAccount = {
  readonly id: string
  readonly role: Role
  readonly email: string
}

type Directory = {
  readonly find: (id: string) => Promise<ManagedAccount | null>
  readonly ban: (id: string, reason: string) => Promise<void>
  readonly unban: (id: string) => Promise<void>
  readonly revokeSessions: (id: string) => Promise<void>
  readonly resetTwoFactor: (id: string) => Promise<void>
}

export type AccountNotice = "two_factor_reset" | "impersonated"

type Dependencies = {
  readonly directory: Directory
  readonly log: ReturnType<typeof createSecurityLog>
  readonly notify: (email: string, kind: AccountNotice) => Promise<void>
}

type Request = {
  readonly actor: { readonly id: string; readonly role: Role }
  readonly targetId: string
  readonly ip: string
  readonly userAgent: string
}

type ManageAction = Exclude<UserAction, "impersonate">

const EVENTS: Record<ManageAction, SecurityEventType> = {
  ban: "user_banned",
  unban: "user_unbanned",
  revoke_sessions: "user_signed_out",
  reset_two_factor: "two_factor_reset",
}

const NOT_FOUND = { ok: false as const, error: "User not found." }

export const createUserAdmin = ({ directory, log, notify }: Dependencies) => {
  const authorize = async (request: Request, action: UserAction) => {
    const target = await directory.find(request.targetId)
    if (!target) return { decision: NOT_FOUND, target: null }
    return {
      decision: checkUserAction({ actor: request.actor, target, action }),
      target,
    }
  }

  const record = (request: Request, type: SecurityEventType, detail?: string) =>
    log.record({
      type,
      actorId: request.actor.id,
      targetId: request.targetId,
      detail,
      ip: request.ip,
      userAgent: request.userAgent,
    })

  const run: Record<
    ManageAction,
    (id: string, reason: string) => Promise<void>
  > = {
    ban: (id, reason) => directory.ban(id, reason),
    unban: (id) => directory.unban(id),
    revoke_sessions: (id) => directory.revokeSessions(id),
    reset_two_factor: async (id) => {
      await directory.resetTwoFactor(id)
      await directory.revokeSessions(id)
    },
  }

  const perform = async ({
    action,
    reason = "",
    ...request
  }: Request & { readonly action: ManageAction; readonly reason?: string }) => {
    const { decision, target } = await authorize(request, action)
    if (!decision.ok || !target) return decision
    await run[action](target.id, reason)
    await record(request, EVENTS[action], reason || undefined)
    if (action === "reset_two_factor")
      await notify(target.email, "two_factor_reset")
    return decision
  }

  const authorizeImpersonation = async (request: Request) => {
    const { decision, target } = await authorize(request, "impersonate")
    if (!decision.ok || !target) return decision
    await record(request, "impersonation_started")
    await notify(target.email, "impersonated")
    return decision
  }

  return { perform, authorizeImpersonation }
}
