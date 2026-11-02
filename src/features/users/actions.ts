"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createRoleService } from "@/features/auth/application/role-service"
import { createUserAdmin } from "@/features/auth/application/user-admin-service"
import { isFreshSession } from "@/features/auth/domain/assurance"
import { ROLES, toRole, type Role } from "@/features/auth/domain/permissions"
import {
  checkUserAction,
  type UserAction,
} from "@/features/auth/domain/user-admin"
import { auth } from "@/features/auth/server/auth"
import { authDb, userObjectId, users } from "@/features/auth/server/database"
import {
  sendAccountNotice,
  sendEventNotice,
} from "@/features/auth/server/notices"
import { securityLog } from "@/features/auth/server/security-log"
import {
  requirePermission,
  requireSession,
} from "@/features/auth/server/session"

const USER_ACTIONS: readonly UserAction[] = [
  "revoke_sessions",
  "reset_two_factor",
  "ban",
  "unban",
  "impersonate",
]

export type ManagedUser = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: Role
  readonly verified: boolean
  readonly banned: boolean
  readonly banReason: string
  readonly twoFactor: boolean
  readonly createdAt: Date
  readonly actions: readonly UserAction[]
}

export type UserFilter = {
  readonly q?: string
  readonly role?: string
  readonly status?: string
}

export type RoleActionState = {
  readonly ok: boolean
  readonly message: string
} | null

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const filterQuery = ({ q, role, status }: UserFilter) => ({
  ...(q?.trim()
    ? {
        $or: [
          { email: { $regex: escapeRegex(q.trim()), $options: "i" } },
          { name: { $regex: escapeRegex(q.trim()), $options: "i" } },
        ],
      }
    : {}),
  ...(ROLES.some((r) => r === role) ? { role } : {}),
  ...(status === "banned" ? { banned: true } : {}),
  ...(status === "unverified" ? { emailVerified: false } : {}),
})

export async function listUsers(
  filter: UserFilter = {}
): Promise<ManagedUser[]> {
  const viewer = await requirePermission("users:read", "/admin/users")
  const docs = await users()
    .find(filterQuery(filter))
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray()
  return docs.map((doc) => {
    const target = { id: doc._id.toHexString(), role: toRole(doc.role) }
    const banned = Boolean(doc.banned)
    return {
      ...target,
      email: doc.email,
      name: doc.name ?? "",
      verified: doc.emailVerified,
      banned,
      banReason: doc.banReason ?? "",
      twoFactor: Boolean(doc.twoFactorEnabled),
      createdAt: doc.createdAt,
      actions: USER_ACTIONS.filter(
        (action) =>
          (action !== "ban" || !banned) &&
          (action !== "unban" || banned) &&
          (action !== "reset_two_factor" || Boolean(doc.twoFactorEnabled)) &&
          checkUserAction({ actor: viewer, target, action }).ok
      ),
    }
  })
}

const revokeSessions = async (id: string) => {
  const context = await auth.$context
  await context.internalAdapter.deleteUserSessions(id)
}

const roles = createRoleService({
  directory: {
    roleOf: async (id) => {
      const _id = userObjectId(id)
      const doc = _id ? await users().findOne({ _id }) : null
      return doc ? toRole(doc.role) : null
    },
    countOwners: () => users().countDocuments({ role: "owner" }),
    setRole: async (id, role) => {
      const _id = userObjectId(id)
      if (_id) await users().updateOne({ _id }, { $set: { role } })
    },
    revokeSessions,
  },
  log: securityLog,
})

const userAdmin = createUserAdmin({
  directory: {
    find: async (id) => {
      const _id = userObjectId(id)
      const doc = _id ? await users().findOne({ _id }) : null
      return doc
        ? {
            id: doc._id.toHexString(),
            role: toRole(doc.role),
            email: doc.email,
          }
        : null
    },
    ban: async (id, reason) => {
      await auth.api.banUser({
        headers: await headers(),
        body: { userId: id, banReason: reason || undefined },
      })
    },
    unban: async (id) => {
      await auth.api.unbanUser({
        headers: await headers(),
        body: { userId: id },
      })
    },
    revokeSessions,
    resetTwoFactor: async (id) => {
      const _id = userObjectId(id)
      if (!_id) return
      await authDb.collection("twoFactor").deleteMany({ userId: _id })
      await authDb
        .collection("verification")
        .deleteMany({ identifier: { $regex: "^trust-device-" }, value: id })
      await users().updateOne({ _id }, { $set: { twoFactorEnabled: false } })
    },
  },
  log: securityLog,
  notify: sendAccountNotice,
})

const requestContext = async () => {
  const requestHeaders = await headers()
  return {
    ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    userAgent: requestHeaders.get("user-agent") ?? "",
  }
}

const MANAGE_MESSAGES = {
  ban: "Account banned and signed out everywhere.",
  unban: "Account unbanned.",
  revoke_sessions: "Signed out on every device.",
  reset_two_factor:
    "Two-factor reset. They've been signed out and emailed, and can set it up again.",
} as const

export async function manageUserAction(
  userId: string,
  action: keyof typeof MANAGE_MESSAGES,
  reason = ""
): Promise<RoleActionState> {
  const actor = await requirePermission("users:manage", "/admin/users")
  const result = await userAdmin.perform({
    actor,
    targetId: userId,
    action,
    reason: reason.trim().slice(0, 200),
    ...(await requestContext()),
  })
  revalidatePath("/admin/users")
  return result.ok
    ? { ok: true, message: MANAGE_MESSAGES[action] }
    : { ok: false, message: result.error }
}

export async function impersonateUserAction(
  userId: string
): Promise<RoleActionState> {
  const actor = await requirePermission("security:impersonate", "/admin/users")
  const result = await userAdmin.authorizeImpersonation({
    actor,
    targetId: userId,
    ...(await requestContext()),
  })
  if (!result.ok) return { ok: false, message: result.error }
  await auth.api.impersonateUser({
    headers: await headers(),
    body: { userId },
  })
  redirect("/dashboard")
}

export async function stopImpersonatingAction(): Promise<void> {
  const user = await requireSession()
  if (user.impersonatedBy) {
    await auth.api.stopImpersonating({ headers: await headers() })
    await securityLog.record({
      type: "impersonation_stopped",
      actorId: user.impersonatedBy,
      targetId: user.id,
      ...(await requestContext()),
    })
  }
  redirect("/admin/users")
}

export async function changeRoleAction(
  userId: string,
  nextRole: string
): Promise<RoleActionState> {
  const actor = await requirePermission("users:assign-roles", "/admin/users")
  const session = await auth.api.getSession({ headers: await headers() })
  if (
    !session ||
    !isFreshSession(new Date(session.session.createdAt), new Date())
  )
    return {
      ok: false,
      message:
        "For your security, role changes need a sign-in from the last 10 minutes. Sign out, sign back in and try again.",
    }
  const role = ROLES.find((candidate) => candidate === nextRole)
  if (!role) return { ok: false, message: "Choose a valid role." }
  const result = await roles.changeRole({
    actor,
    targetId: userId,
    nextRole: role,
    ...(await requestContext()),
  })
  revalidatePath("/admin/users")
  if (!result.ok) return { ok: false, message: result.error }
  const _id = userObjectId(userId)
  const target = _id ? await users().findOne({ _id }) : null
  if (target) await sendEventNotice(target.email, "role_changed")
  return {
    ok: true,
    message: "Role updated. They've been signed out so it takes effect now.",
  }
}
