import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/admin/access"

import {
  can,
  PERMISSIONS,
  ROLES,
  type Permission,
  type Role,
} from "../domain/permissions"

const statement = {
  ...defaultStatements,
  portal: ["self"],
  billing: ["read", "write", "approve-credits"],
  support: ["read", "write"],
  inquiries: ["read", "write"],
  security: ["read"],
} as const

export const accessControl = createAccessControl(statement)

type Grants = {
  [Resource in keyof typeof statement]?: (typeof statement)[Resource][number][]
}

/** What each app permission means in Better Auth's resource/action terms. */
const GRANTS: Record<Permission, Grants> = {
  "portal:self": { portal: ["self"] },
  "billing:read": { billing: ["read"] },
  "billing:write": { billing: ["write"] },
  "billing:approve-credits": { billing: ["approve-credits"] },
  "support:read": { support: ["read"] },
  "support:write": { support: ["write"] },
  "inquiries:read": { inquiries: ["read"] },
  "inquiries:write": { inquiries: ["write"] },
  "users:read": { user: ["list", "get"], session: ["list"] },
  "users:manage": { user: ["ban", "update"], session: ["revoke"] },
  "users:assign-roles": { user: ["set-role"] },
  "security:read": { security: ["read"] },
  "security:impersonate": { user: ["impersonate"] },
}

/** Every grant behind a role's permissions, merged per resource. */
const grantsFor = (role: Role): Grants =>
  PERMISSIONS.filter((permission) => can(role, permission))
    .flatMap((permission) => Object.entries(GRANTS[permission]))
    .reduce<Record<string, string[]>>((grants, [resource, actions]) => {
      grants[resource] = [...new Set([...(grants[resource] ?? []), ...actions])]
      return grants
    }, {}) as Grants

/**
 * Better Auth's roles, generated from the app's permission matrix so the two
 * can't drift apart. The matrix in domain/permissions is the one source.
 */
export const authRoles = Object.fromEntries(
  ROLES.map((role) => [role, accessControl.newRole(grantsFor(role))])
) as Record<Role, ReturnType<typeof accessControl.newRole>>
