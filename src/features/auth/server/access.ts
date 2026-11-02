import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements } from "better-auth/plugins/admin/access"

import type { Permission } from "../domain/permissions"

const statement = {
  ...defaultStatements,
  portal: ["self"],
  billing: ["read", "write"],
  support: ["read", "write"],
  inquiries: ["read", "write"],
  security: ["read"],
} as const

export const accessControl = createAccessControl(statement)

type Request = {
  [Resource in keyof typeof statement]?: (typeof statement)[Resource][number][]
}

const REQUESTS: Record<Permission, Request> = {
  "portal:self": { portal: ["self"] },
  "billing:read": { billing: ["read"] },
  "billing:write": { billing: ["write"] },
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

export const requestFor = (permission: Permission) => REQUESTS[permission]

const studio = {
  portal: ["self"],
  billing: ["read", "write"],
  support: ["read", "write"],
  inquiries: ["read", "write"],
} as const

export const authRoles = {
  owner: accessControl.newRole({
    ...studio,
    security: ["read"],
    user: [
      "create",
      "list",
      "get",
      "update",
      "set-role",
      "ban",
      "impersonate",
      "delete",
      "set-password",
      "set-email",
    ],
    session: ["list", "revoke", "delete"],
  }),
  admin: accessControl.newRole({
    ...studio,
    user: ["list", "get", "update", "ban"],
    session: ["list", "revoke"],
  }),
  client: accessControl.newRole({ portal: ["self"] }),
}
