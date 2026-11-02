import { describe, expect, it } from "vitest"

import {
  can,
  isStaff,
  PERMISSIONS,
  permissionsFor,
  ROLES,
  toRole,
  type Permission,
} from "./permissions"

const STAFF_ONLY: readonly Permission[] = [
  "billing:read",
  "billing:write",
  "support:read",
  "support:write",
  "inquiries:read",
  "inquiries:write",
  "users:read",
  "users:manage",
]

const OWNER_ONLY: readonly Permission[] = [
  "billing:approve-credits",
  "users:assign-roles",
  "security:read",
  "security:impersonate",
]

describe("permissions", () => {
  it("gives the owner every permission", () => {
    expect(PERMISSIONS.every((permission) => can("owner", permission))).toBe(
      true
    )
  })

  it("lets admins run the studio but not manage roles or security", () => {
    expect(STAFF_ONLY.every((permission) => can("admin", permission))).toBe(
      true
    )
    expect(OWNER_ONLY.some((permission) => can("admin", permission))).toBe(
      false
    )
  })

  it("limits clients to their own portal", () => {
    expect(permissionsFor("client")).toEqual(["portal:self"])
  })

  it("gives every role its own portal", () => {
    expect(ROLES.every((role) => can(role, "portal:self"))).toBe(true)
  })

  it("grants nothing to visitors without a role", () => {
    expect(can(null, "portal:self")).toBe(false)
    expect(can(undefined, "billing:read")).toBe(false)
  })

  it("treats the owner and admins as staff", () => {
    expect(ROLES.filter(isStaff)).toEqual(["owner", "admin"])
  })

  it("reads unknown or legacy roles as client", () => {
    expect(toRole("owner")).toBe("owner")
    expect(toRole("admin")).toBe("admin")
    expect(toRole("user")).toBe("client")
    expect(toRole("superuser")).toBe("client")
    expect(toRole(undefined)).toBe("client")
  })
})
