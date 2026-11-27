// @vitest-environment node
import { describe, expect, it } from "vitest"

import { authRoles } from "./access"

describe("Better Auth roles, generated from the permission matrix", () => {
  it("lets only the owner change roles and impersonate", () => {
    expect(authRoles.owner.authorize({ user: ["set-role"] }).success).toBe(true)
    expect(authRoles.owner.authorize({ user: ["impersonate"] }).success).toBe(
      true
    )
    expect(authRoles.admin.authorize({ user: ["set-role"] }).success).toBe(
      false
    )
    expect(authRoles.admin.authorize({ user: ["impersonate"] }).success).toBe(
      false
    )
  })

  it("lets staff ban, which the admin screen calls server-side", () => {
    expect(authRoles.owner.authorize({ user: ["ban"] }).success).toBe(true)
    expect(authRoles.admin.authorize({ user: ["ban"] }).success).toBe(true)
  })

  it("grants nothing the app doesn't use", () => {
    for (const action of [
      "create",
      "delete",
      "set-password",
      "set-email",
    ] as const)
      expect(authRoles.owner.authorize({ user: [action] }).success).toBe(false)
    expect(authRoles.owner.authorize({ session: ["delete"] }).success).toBe(
      false
    )
  })

  it("keeps clients to their own portal", () => {
    expect(authRoles.client.authorize({ portal: ["self"] }).success).toBe(true)
    expect(authRoles.client.authorize({ user: ["list"] }).success).toBe(false)
    expect(authRoles.client.authorize({ billing: ["read"] }).success).toBe(
      false
    )
  })

  it("matches the matrix for billing approval", () => {
    expect(
      authRoles.owner.authorize({ billing: ["approve-credits"] }).success
    ).toBe(true)
    expect(
      authRoles.admin.authorize({ billing: ["approve-credits"] }).success
    ).toBe(false)
  })
})
