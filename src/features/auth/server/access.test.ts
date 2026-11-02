// @vitest-environment node
import { describe, expect, it } from "vitest"

import { can, PERMISSIONS, ROLES } from "../domain/permissions"
import { authRoles, requestFor } from "./access"

describe("Better Auth access control", () => {
  it.each(ROLES)("matches the permission matrix for %s", (role) => {
    const granted = PERMISSIONS.filter(
      (permission) => authRoles[role].authorize(requestFor(permission)).success
    )
    expect(granted).toEqual(
      PERMISSIONS.filter((permission) => can(role, permission))
    )
  })

  it("only lets the owner change roles through the admin API", () => {
    expect(authRoles.owner.authorize({ user: ["set-role"] }).success).toBe(true)
    expect(authRoles.admin.authorize({ user: ["set-role"] }).success).toBe(
      false
    )
    expect(authRoles.client.authorize({ user: ["list"] }).success).toBe(false)
  })
})
