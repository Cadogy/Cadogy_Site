import { describe, expect, it } from "vitest"

import { createSecurityLog } from "./security-log"
import { createInMemorySecurityEvents } from "./test-doubles"

const NOW = new Date("2026-11-01T12:00:00.000Z")

const setup = () => {
  const repository = createInMemorySecurityEvents()
  const log = createSecurityLog({ repository, clock: () => NOW })
  return { log, repository }
}

const context = { ip: "203.0.113.7", userAgent: "Firefox on macOS" }

describe("security log", () => {
  it("records who did what, to whom, from where and when", async () => {
    const { log, repository } = setup()

    await log.record({
      type: "role_changed",
      actorId: "u_owner",
      targetId: "u_admin",
      detail: "client → admin",
      ...context,
    })

    expect(await repository.list({})).toEqual([
      {
        type: "role_changed",
        actorId: "u_owner",
        targetId: "u_admin",
        detail: "client → admin",
        ip: "203.0.113.7",
        userAgent: "Firefox on macOS",
        at: NOW,
      },
    ])
  })

  it("shows people only events about their own account, newest first", async () => {
    const { log, repository } = setup()
    await log.record({
      type: "sign_in",
      actorId: "u_1",
      targetId: "u_1",
      ...context,
    })
    await log.record({
      type: "sign_in",
      actorId: "u_2",
      targetId: "u_2",
      ...context,
    })
    await log.record({
      type: "password_changed",
      actorId: "u_1",
      targetId: "u_1",
      ...context,
    })

    const mine = await log.forUser("u_1")

    expect(mine.map((event) => event.type)).toEqual([
      "password_changed",
      "sign_in",
    ])
    expect(await repository.list({})).toHaveLength(3)
  })

  it("never lets logging failures break the request", async () => {
    const log = createSecurityLog({
      repository: {
        insert: async () => {
          throw new Error("database down")
        },
        list: async () => [],
      },
      clock: () => NOW,
    })

    await expect(
      log.record({
        type: "sign_out",
        actorId: "u_1",
        targetId: "u_1",
        ...context,
      })
    ).resolves.toBeUndefined()
  })
})
