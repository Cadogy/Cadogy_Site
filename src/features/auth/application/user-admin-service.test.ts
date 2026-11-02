import { describe, expect, it } from "vitest"

import type { Role } from "../domain/permissions"
import { createSecurityLog } from "./security-log"
import { createInMemorySecurityEvents } from "./test-doubles"
import { createUserAdmin } from "./user-admin-service"

const NOW = new Date("2026-11-01T12:00:00.000Z")
const context = { ip: "203.0.113.7", userAgent: "Firefox on macOS" }
const owner = { id: "u_owner", role: "owner" as const }
const admin = { id: "u_admin", role: "admin" as const }

const setup = (people: Record<string, Role>) => {
  const calls: string[] = []
  const notices: { email: string; kind: string }[] = []
  const events = createInMemorySecurityEvents()
  const service = createUserAdmin({
    directory: {
      find: async (id) =>
        people[id]
          ? { id, role: people[id], email: `${id}@example.com` }
          : null,
      ban: async (id, reason) => {
        calls.push(`ban ${id} ${reason}`)
      },
      unban: async (id) => {
        calls.push(`unban ${id}`)
      },
      revokeSessions: async (id) => {
        calls.push(`revoke ${id}`)
      },
      resetTwoFactor: async (id) => {
        calls.push(`reset ${id}`)
      },
    },
    log: createSecurityLog({ repository: events, clock: () => NOW }),
    notify: async (email, kind) => {
      notices.push({ email, kind })
    },
  })
  return { service, calls, notices, events }
}

describe("user admin", () => {
  it("bans a client with a reason and logs it", async () => {
    const { service, calls, events } = setup({
      u_owner: "owner",
      u_ada: "client",
    })

    const result = await service.perform({
      actor: admin,
      targetId: "u_ada",
      action: "ban",
      reason: "Chargeback abuse",
      ...context,
    })

    expect(result).toEqual({ ok: true, value: null })
    expect(calls).toEqual(["ban u_ada Chargeback abuse"])
    expect(await events.list({})).toMatchObject([
      {
        type: "user_banned",
        actorId: "u_admin",
        targetId: "u_ada",
        detail: "Chargeback abuse",
      },
    ])
  })

  it("resets two-factor, signs the person out and tells them", async () => {
    const { service, calls, notices } = setup({ u_ada: "client" })

    await service.perform({
      actor: owner,
      targetId: "u_ada",
      action: "reset_two_factor",
      ...context,
    })

    expect(calls).toEqual(["reset u_ada", "revoke u_ada"])
    expect(notices).toEqual([
      { email: "u_ada@example.com", kind: "two_factor_reset" },
    ])
  })

  it("refuses actions the policy doesn't allow and changes nothing", async () => {
    const { service, calls, events } = setup({ u_admin_2: "admin" })

    const result = await service.perform({
      actor: admin,
      targetId: "u_admin_2",
      action: "revoke_sessions",
      ...context,
    })

    expect(result).toMatchObject({ ok: false })
    expect(calls).toEqual([])
    expect(await events.list({})).toEqual([])
  })

  it("approves viewing a client's portal, logs it and tells the client", async () => {
    const { service, notices, events } = setup({ u_ada: "client" })

    const result = await service.authorizeImpersonation({
      actor: owner,
      targetId: "u_ada",
      ...context,
    })

    expect(result).toEqual({ ok: true, value: null })
    expect(notices).toEqual([
      { email: "u_ada@example.com", kind: "impersonated" },
    ])
    expect(await events.list({})).toMatchObject([
      { type: "impersonation_started", targetId: "u_ada" },
    ])
  })

  it("reports unknown users", async () => {
    const { service } = setup({})

    expect(
      await service.perform({
        actor: owner,
        targetId: "u_ghost",
        action: "ban",
        ...context,
      })
    ).toEqual({
      ok: false,
      error: "User not found.",
    })
  })
})
