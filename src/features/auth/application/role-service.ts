import type { Role } from "../domain/permissions"
import { checkRoleChange } from "../domain/roles"
import type { createSecurityLog } from "./security-log"

type Directory = {
  readonly roleOf: (userId: string) => Promise<Role | null>
  readonly countOwners: () => Promise<number>
  readonly setRole: (userId: string, role: Role) => Promise<void>
  readonly revokeSessions: (userId: string) => Promise<void>
}

type Dependencies = {
  readonly directory: Directory
  readonly log: ReturnType<typeof createSecurityLog>
}

type ChangeRequest = {
  readonly actor: { readonly id: string; readonly role: Role }
  readonly targetId: string
  readonly nextRole: Role
  readonly ip: string
  readonly userAgent: string
}

export const createRoleService = ({ directory, log }: Dependencies) => {
  const changeRole = async ({
    actor,
    targetId,
    nextRole,
    ip,
    userAgent,
  }: ChangeRequest) => {
    const currentRole = await directory.roleOf(targetId)
    if (!currentRole) return { ok: false as const, error: "User not found." }

    const decision = checkRoleChange({
      actor,
      target: { id: targetId, role: currentRole },
      nextRole,
      ownerCount: await directory.countOwners(),
    })
    if (!decision.ok) return decision

    await directory.setRole(targetId, nextRole)
    await directory.revokeSessions(targetId)
    await log.record({
      type: "role_changed",
      actorId: actor.id,
      targetId,
      detail: `${currentRole} → ${nextRole}`,
      ip,
      userAgent,
    })
    return decision
  }

  return { changeRole }
}
