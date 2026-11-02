"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { createRoleService } from "@/features/auth/application/role-service"
import { ROLES, toRole, type Role } from "@/features/auth/domain/permissions"
import { auth } from "@/features/auth/server/auth"
import { userObjectId, users } from "@/features/auth/server/database"
import { securityLog } from "@/features/auth/server/security-log"
import { requirePermission } from "@/features/auth/server/session"

export type ManagedUser = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: Role
  readonly verified: boolean
  readonly banned: boolean
  readonly createdAt: Date
}

export type RoleActionState = {
  readonly ok: boolean
  readonly message: string
} | null

export async function listUsers(): Promise<ManagedUser[]> {
  await requirePermission("users:read", "/admin/users")
  const docs = await users()
    .find({})
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray()
  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    email: doc.email,
    name: doc.name ?? "",
    role: toRole(doc.role),
    verified: doc.emailVerified,
    banned: Boolean(doc.banned),
    createdAt: doc.createdAt,
  }))
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
    revokeSessions: async (id) => {
      const context = await auth.$context
      await context.internalAdapter.deleteUserSessions(id)
    },
  },
  log: securityLog,
})

const requestContext = async () => {
  const requestHeaders = await headers()
  return {
    ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    userAgent: requestHeaders.get("user-agent") ?? "",
  }
}

export async function changeRoleAction(
  userId: string,
  nextRole: string
): Promise<RoleActionState> {
  const actor = await requirePermission("users:assign-roles", "/admin/users")
  const role = ROLES.find((candidate) => candidate === nextRole)
  if (!role) return { ok: false, message: "Choose a valid role." }
  const result = await roles.changeRole({
    actor,
    targetId: userId,
    nextRole: role,
    ...(await requestContext()),
  })
  revalidatePath("/admin/users")
  return result.ok
    ? {
        ok: true,
        message:
          "Role updated. They've been signed out so it takes effect now.",
      }
    : { ok: false, message: result.error }
}
