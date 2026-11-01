// @vitest-environment node
import { describe, expect, it, vi } from "vitest"

import { AUTH_ERRORS, authorizeCredentials } from "./credentials"

const verifiedUser = {
  id: "u1",
  name: "Ada",
  email: "ada@example.com",
  image: null,
  role: "user" as const,
  passwordHash: "hash",
  emailVerified: new Date("2026-01-01"),
}

const deps = (overrides = {}) => ({
  verifyTurnstile: vi.fn(async () => true),
  findUserByEmail: vi.fn(async () => verifiedUser),
  verifyPassword: vi.fn(async () => true),
  ...overrides,
})

const input = {
  email: "Ada@Example.com ",
  password: "correct horse",
  turnstileToken: "t",
}

describe("authorizeCredentials", () => {
  it("returns the session user for valid, verified credentials", async () => {
    const d = deps()
    await expect(
      authorizeCredentials(input, "203.0.113.1", d)
    ).resolves.toEqual({
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      image: null,
      role: "user",
    })
    expect(d.findUserByEmail).toHaveBeenCalledWith("ada@example.com")
  })

  it("checks the human verification before touching the database", async () => {
    const d = deps({ verifyTurnstile: vi.fn(async () => false) })
    await expect(authorizeCredentials(input, "ip", d)).rejects.toThrow(
      AUTH_ERRORS.verification
    )
    expect(d.findUserByEmail).not.toHaveBeenCalled()
  })

  it("gives the same error for unknown accounts and wrong passwords", async () => {
    await expect(
      authorizeCredentials(
        input,
        "ip",
        deps({ findUserByEmail: vi.fn(async () => null) })
      )
    ).rejects.toThrow(AUTH_ERRORS.invalid)
    await expect(
      authorizeCredentials(
        input,
        "ip",
        deps({ verifyPassword: vi.fn(async () => false) })
      )
    ).rejects.toThrow(AUTH_ERRORS.invalid)
  })

  it("only reveals the unverified state after the password is proven", async () => {
    const unverified = { ...verifiedUser, emailVerified: null }
    await expect(
      authorizeCredentials(
        input,
        "ip",
        deps({ findUserByEmail: vi.fn(async () => unverified) })
      )
    ).rejects.toThrow(AUTH_ERRORS.unverified)
    await expect(
      authorizeCredentials(
        input,
        "ip",
        deps({
          findUserByEmail: vi.fn(async () => unverified),
          verifyPassword: vi.fn(async () => false),
        })
      )
    ).rejects.toThrow(AUTH_ERRORS.invalid)
  })

  it("rejects malformed input", async () => {
    await expect(
      authorizeCredentials(
        { email: "x", password: "", turnstileToken: "" },
        "ip",
        deps()
      )
    ).rejects.toThrow(AUTH_ERRORS.invalid)
  })
})
