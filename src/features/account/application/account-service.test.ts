// @vitest-environment node
import { describe, expect, it } from "vitest"

import {
  createAccountService,
  type AccountDependencies,
  type StoredToken,
} from "./account-service"

const NOW = new Date("2026-11-01T12:00:00.000Z")

type StoredAccount = {
  email: string
  passwordHash: string
  emailVerified: Date | null
}

const setup = (overrides: Partial<AccountDependencies> = {}) => {
  const users = new Map<string, StoredAccount>()
  const tokens: StoredToken[] = []
  const emails: { kind: string; to: string; token: string }[] = []
  let counter = 0

  const deps: AccountDependencies = {
    clock: () => NOW,
    randomToken: () => `raw-token-${++counter}`,
    verifyTurnstile: async (token) => token === "human",
    hashPassword: async (password) => `hashed:${password}`,
    verifyPassword: async (password, hash) => hash === `hashed:${password}`,
    users: {
      findByEmail: async (email) => users.get(email) ?? null,
      create: async (email, passwordHash) => {
        users.set(email, { email, passwordHash, emailVerified: null })
      },
      markVerified: async (email, at) => {
        const user = users.get(email)
        if (user) users.set(email, { ...user, emailVerified: at })
      },
      setPassword: async (email, passwordHash) => {
        const user = users.get(email)
        if (user) users.set(email, { ...user, passwordHash })
      },
    },
    tokens: {
      save: async (token) => {
        tokens.push(token)
      },
      consume: async (purpose, tokenHash, now) => {
        const index = tokens.findIndex(
          (token) =>
            token.purpose === purpose &&
            token.tokenHash === tokenHash &&
            token.expiresAt > now
        )
        if (index === -1) return null
        const [token] = tokens.splice(index, 1)
        return token ?? null
      },
      deleteFor: async (purpose, email) => {
        for (let index = tokens.length - 1; index >= 0; index--) {
          if (
            tokens[index]?.purpose === purpose &&
            tokens[index]?.email === email
          )
            tokens.splice(index, 1)
        }
      },
    },
    mailer: {
      sendVerification: async (to, token) => {
        emails.push({ kind: "verify", to, token })
      },
      sendPasswordReset: async (to, token) => {
        emails.push({ kind: "reset", to, token })
      },
    },
    ...overrides,
  }
  return { service: createAccountService(deps), users, tokens, emails }
}

const registration = {
  email: "Ada@Example.com",
  password: "Str0ngPassword",
  turnstileToken: "human",
}

describe("account service", () => {
  it("registers an unverified account and emails a verification link", async () => {
    const { service, users, emails, tokens } = setup()

    expect(await service.register(registration, "ip")).toEqual({ ok: true })

    expect(users.get("ada@example.com")).toMatchObject({
      passwordHash: "hashed:Str0ngPassword",
      emailVerified: null,
    })
    expect(emails).toEqual([
      { kind: "verify", to: "ada@example.com", token: "raw-token-1" },
    ])
    expect(tokens[0]?.tokenHash).not.toContain("raw-token-1")
  })

  it("does not reveal whether an email is already registered", async () => {
    const { service, emails } = setup()
    await service.register(registration, "ip")

    expect(await service.register(registration, "ip")).toEqual({ ok: true })
    expect(emails).toHaveLength(1)
  })

  it("enforces password strength and human verification", async () => {
    const { service } = setup()
    expect(
      await service.register({ ...registration, password: "short" }, "ip")
    ).toMatchObject({
      ok: false,
      field: "password",
    })
    expect(
      await service.register({ ...registration, turnstileToken: "bot" }, "ip")
    ).toEqual({
      ok: false,
      error: "We couldn't verify you're human. Please try again.",
    })
  })

  it("verifies an email exactly once with a valid token", async () => {
    const { service, users } = setup()
    await service.register(registration, "ip")

    expect(await service.verifyEmail("raw-token-1")).toEqual({ ok: true })
    expect(users.get("ada@example.com")?.emailVerified).toEqual(NOW)
    expect(await service.verifyEmail("raw-token-1")).toMatchObject({
      ok: false,
    })
  })

  it("rejects unknown verification tokens even after someone else verified", async () => {
    const { service } = setup()
    await service.register(registration, "ip")
    await service.verifyEmail("raw-token-1")

    expect(await service.verifyEmail("made-up")).toMatchObject({ ok: false })
  })

  it("never accepts a verification token as a password reset token", async () => {
    const { service, users } = setup()
    await service.register(registration, "ip")

    const result = await service.resetPassword({
      token: "raw-token-1",
      password: "An0therPassword",
      confirmPassword: "An0therPassword",
    })

    expect(result).toMatchObject({ ok: false })
    expect(users.get("ada@example.com")?.passwordHash).toBe(
      "hashed:Str0ngPassword"
    )
  })

  it("resets a password with a reset token and invalidates it afterwards", async () => {
    const { service, users, emails } = setup()
    await service.register(registration, "ip")
    await service.requestPasswordReset(
      { email: "ada@example.com", turnstileToken: "human" },
      "ip"
    )
    const resetToken =
      emails.find((email) => email.kind === "reset")?.token ?? ""

    const input = {
      token: resetToken,
      password: "An0therPassword",
      confirmPassword: "An0therPassword",
    }
    expect(await service.resetPassword(input)).toEqual({ ok: true })
    expect(users.get("ada@example.com")?.passwordHash).toBe(
      "hashed:An0therPassword"
    )
    expect(await service.resetPassword(input)).toMatchObject({ ok: false })
  })

  it("answers password reset requests identically for unknown emails", async () => {
    const { service, emails } = setup()
    expect(
      await service.requestPasswordReset(
        { email: "ghost@example.com", turnstileToken: "human" },
        "ip"
      )
    ).toEqual({ ok: true })
    expect(emails).toEqual([])
  })

  it("rejects mismatched password confirmations", async () => {
    const { service } = setup()
    expect(
      await service.resetPassword({
        token: "x",
        password: "An0therPassword",
        confirmPassword: "nope",
      })
    ).toMatchObject({ ok: false, field: "confirmPassword" })
  })

  it("resends verification only to unverified accounts and replaces older links", async () => {
    const { service, emails, tokens } = setup()
    await service.register(registration, "ip")

    await service.resendVerification({ email: "ada@example.com" })

    expect(emails.map((email) => email.kind)).toEqual(["verify", "verify"])
    expect(
      tokens.filter((token) => token.purpose === "verify-email")
    ).toHaveLength(1)
    expect(await service.verifyEmail("raw-token-1")).toMatchObject({
      ok: false,
    })
    expect(await service.verifyEmail("raw-token-2")).toEqual({ ok: true })

    await service.resendVerification({ email: "ada@example.com" })
    expect(emails).toHaveLength(2)
  })

  it("changes a password only when the current password is correct", async () => {
    const { service, users } = setup()
    await service.register(registration, "ip")
    const userPasswordHash = () => users.get("ada@example.com")?.passwordHash

    expect(
      await service.changePassword("ada@example.com", {
        currentPassword: "wrong",
        password: "An0therPassword",
        confirmPassword: "An0therPassword",
      })
    ).toMatchObject({ ok: false, field: "currentPassword" })
    expect(userPasswordHash()).toBe("hashed:Str0ngPassword")

    expect(
      await service.changePassword("ada@example.com", {
        currentPassword: "Str0ngPassword",
        password: "An0therPassword",
        confirmPassword: "An0therPassword",
      })
    ).toEqual({ ok: true })
    expect(userPasswordHash()).toBe("hashed:An0therPassword")
  })
})
