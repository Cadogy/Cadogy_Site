import { describe, expect, it } from "vitest"

import type { Role } from "../domain/permissions"
import { createRoleService } from "./role-service"
import { createSecurityLog } from "./security-log"
import { createInMemorySecurityEvents } from "./test-doubles"

const NOW = new Date("2026-11-01T12:00:00.000Z")
const context = { ip: "203.0.113.7", userAgent: "Safari" }

const setup = (people: Record<string, Role>) => {
  const roles = new Map(Object.entries(people))
  const revoked: string[] = []
  const events = createInMemorySecurityEvents()
  const service = createRoleService({
    directory: {
      roleOf: async (id) => roles.get(id) ?? null,
      countOwners: async () =>
        [...roles.values()].filter((role) => role === "owner").length,
      setRole: async (id, role) => {
        roles.set(id, role)
      },
      revokeSessions: async (id) => {
        revoked.push(id)
      },
    },
    log: createSecurityLog({ repository: events, clock: () => NOW }),
  })
  return { service, roles, revoked, events }
}

const owner = { id: "u_owner", role: "owner" as const }

describe("role service", () => {
  it("changes the role, signs the user out everywhere and logs it", async () => {
    const { service, roles, revoked, events } = setup({
      u_owner: "owner",
      u_dylan: "client",
    })

    const result = await service.changeRole({
      actor: owner,
      targetId: "u_dylan",
      nextRole: "admin",
      ...context,
    })

    expect(result).toEqual({ ok: true, value: null })
    expect(roles.get("u_dylan")).toBe("admin")
    expect(revoked).toEqual(["u_dylan"])
    expect(await events.list({})).toMatchObject([
      {
        type: "role_changed",
        actorId: "u_owner",
        targetId: "u_dylan",
        detail: "client → admin",
      },
    ])
  })

  it("refuses changes that break the owner rules and changes nothing", async () => {
    const { service, roles, revoked, events } = setup({
      u_owner: "owner",
      u_admin: "admin",
    })

    const result = await service.changeRole({
      actor: { id: "u_admin", role: "admin" },
      targetId: "u_owner",
      nextRole: "client",
      ...context,
    })

    expect(result).toEqual({
      ok: false,
      error: "Only an owner can change roles.",
    })
    expect(roles.get("u_owner")).toBe("owner")
    expect(revoked).toEqual([])
    expect(await events.list({})).toEqual([])
  })

  it("reports unknown users", async () => {
    const { service } = setup({ u_owner: "owner" })

    expect(
      await service.changeRole({
        actor: owner,
        targetId: "u_ghost",
        nextRole: "admin",
        ...context,
      })
    ).toEqual({ ok: false, error: "User not found." })
  })
})
