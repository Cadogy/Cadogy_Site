import { describe, expect, it } from "vitest"

import { createLockout, LOCKOUT } from "./lockout"

const setup = () => {
  let now = new Date("2026-11-01T12:00:00.000Z")
  const failures: { email: string; at: Date }[] = []
  const alerts: string[] = []
  const lockout = createLockout({
    repository: {
      add: async (email, at) => {
        failures.push({ email, at })
      },
      countSince: async (email, since) =>
        failures.filter((f) => f.email === email && f.at >= since).length,
      clear: async (email) => {
        failures.splice(
          0,
          failures.length,
          ...failures.filter((f) => f.email !== email)
        )
      },
    },
    clock: () => now,
    onLocked: async (email) => {
      alerts.push(email)
    },
  })
  const advance = (minutes: number) => {
    now = new Date(now.getTime() + minutes * 60_000)
  }
  return { lockout, alerts, advance }
}

const fail = async (
  lockout: ReturnType<typeof setup>["lockout"],
  email: string,
  times: number
) => {
  for (let i = 0; i < times; i++) await lockout.recordFailure(email)
}

describe("password lockout", () => {
  it("allows sign-in attempts below the limit", async () => {
    const { lockout } = setup()
    await fail(lockout, "ada@example.com", LOCKOUT.maxFailures - 1)

    expect(await lockout.isLocked("ada@example.com")).toBe(false)
  })

  it("locks the email after too many failures and alerts once", async () => {
    const { lockout, alerts } = setup()
    await fail(lockout, "ada@example.com", LOCKOUT.maxFailures + 3)

    expect(await lockout.isLocked("ada@example.com")).toBe(true)
    expect(await lockout.isLocked("eve@example.com")).toBe(false)
    expect(alerts).toEqual(["ada@example.com"])
  })

  it("unlocks once the window passes", async () => {
    const { lockout, advance } = setup()
    await fail(lockout, "ada@example.com", LOCKOUT.maxFailures)

    advance(LOCKOUT.windowMinutes + 1)

    expect(await lockout.isLocked("ada@example.com")).toBe(false)
  })

  it("forgets failures after a successful sign-in", async () => {
    const { lockout } = setup()
    await fail(lockout, "ada@example.com", LOCKOUT.maxFailures - 1)

    await lockout.clear("ada@example.com")
    await fail(lockout, "ada@example.com", 1)

    expect(await lockout.isLocked("ada@example.com")).toBe(false)
  })

  it("treats emails case-insensitively", async () => {
    const { lockout } = setup()
    await fail(lockout, "Ada@Example.com", LOCKOUT.maxFailures)

    expect(await lockout.isLocked("ada@example.com")).toBe(true)
  })
})
