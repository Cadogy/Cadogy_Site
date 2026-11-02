import { describe, expect, it } from "vitest"

import { createGuards, type SessionUser } from "./guards"

class Redirect extends Error {
  constructor(readonly location: string) {
    super(location)
  }
}

const redirect = (location: string): never => {
  throw new Redirect(location)
}

const user = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: "u_1",
  email: "ada@example.com",
  name: "Ada",
  role: "client",
  ...overrides,
})

const guardsFor = (session: SessionUser | null) =>
  createGuards({ currentUser: async () => session, redirect })

const redirectOf = async (attempt: Promise<unknown>) => {
  try {
    await attempt
  } catch (error) {
    if (error instanceof Redirect) return error.location
    throw error
  }
  return null
}

describe("auth guards", () => {
  it("sends signed-out visitors to sign in and back again", async () => {
    const guards = guardsFor(null)

    expect(await redirectOf(guards.requireSession("/dashboard/billing"))).toBe(
      "/login?callbackUrl=%2Fdashboard%2Fbilling"
    )
  })

  it("returns the signed-in user", async () => {
    await expect(guardsFor(user()).requireSession()).resolves.toMatchObject({
      email: "ada@example.com",
    })
  })

  it("lets staff use studio permissions", async () => {
    const guards = guardsFor(user({ role: "admin" }))

    await expect(
      guards.requirePermission("billing:write")
    ).resolves.toMatchObject({
      role: "admin",
    })
  })

  it("sends clients back to their dashboard from studio pages and actions", async () => {
    const guards = guardsFor(user())

    expect(await redirectOf(guards.requirePermission("billing:write"))).toBe(
      "/dashboard"
    )
    expect(await redirectOf(guards.requireStaff())).toBe("/dashboard")
  })

  it("keeps owner-only permissions from admins", async () => {
    const guards = guardsFor(user({ role: "admin" }))

    expect(
      await redirectOf(guards.requirePermission("users:assign-roles"))
    ).toBe("/admin")
  })

  it("asks signed-out visitors to sign in before checking permissions", async () => {
    expect(
      await redirectOf(
        guardsFor(null).requirePermission("billing:read", "/admin")
      )
    ).toBe("/login?callbackUrl=%2Fadmin")
  })
})
