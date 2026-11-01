import { createHash } from "node:crypto"
import { z } from "zod"

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000
const RESET_TTL_MS = 60 * 60 * 1000

export type TokenPurpose = "verify-email" | "reset-password"

export type StoredToken = {
  readonly purpose: TokenPurpose
  readonly email: string
  readonly tokenHash: string
  readonly expiresAt: Date
}

type AccountRecord = {
  readonly email: string
  readonly emailVerified: Date | null
  readonly passwordHash: string | null
}

export type AccountDependencies = {
  readonly clock: () => Date
  readonly randomToken: () => string
  readonly verifyTurnstile: (token: string, ip: string) => Promise<boolean>
  readonly hashPassword: (password: string) => Promise<string>
  readonly verifyPassword: (password: string, hash: string) => Promise<boolean>
  readonly users: {
    readonly findByEmail: (email: string) => Promise<AccountRecord | null>
    readonly create: (email: string, passwordHash: string) => Promise<void>
    readonly markVerified: (email: string, at: Date) => Promise<void>
    readonly setPassword: (email: string, passwordHash: string) => Promise<void>
  }
  readonly tokens: {
    readonly save: (token: StoredToken) => Promise<void>
    readonly consume: (
      purpose: TokenPurpose,
      tokenHash: string,
      now: Date
    ) => Promise<StoredToken | null>
    readonly deleteFor: (purpose: TokenPurpose, email: string) => Promise<void>
  }
  readonly mailer: {
    readonly sendVerification: (to: string, token: string) => Promise<void>
    readonly sendPasswordReset: (to: string, token: string) => Promise<void>
  }
}

export type AccountResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string; readonly field?: string }

const OK: AccountResult = { ok: true }
const HUMAN_CHECK_FAILED: AccountResult = {
  ok: false,
  error: "We couldn't verify you're human. Please try again.",
}

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Please enter a valid email address."))

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "Use at most 200 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/\d/, "Include a number.")

const registerSchema = z.object({
  email,
  password: passwordSchema,
  turnstileToken: z.string().default(""),
})

const resetRequestSchema = z.object({
  email,
  turnstileToken: z.string().default(""),
})

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

const invalid = (error: z.ZodError): AccountResult => {
  const issue = error.issues[0]
  return {
    ok: false,
    error: issue?.message ?? "Please check the form and try again.",
    field: issue?.path[0] === undefined ? undefined : String(issue.path[0]),
  }
}

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")

export const createAccountService = (deps: AccountDependencies) => {
  const issueToken = async (
    purpose: TokenPurpose,
    address: string,
    ttlMs: number
  ) => {
    await deps.tokens.deleteFor(purpose, address)
    const raw = deps.randomToken()
    await deps.tokens.save({
      purpose,
      email: address,
      tokenHash: hashToken(raw),
      expiresAt: new Date(deps.clock().getTime() + ttlMs),
    })
    return raw
  }

  const register = async (raw: unknown, ip: string): Promise<AccountResult> => {
    const parsed = registerSchema.safeParse(raw)
    if (!parsed.success) return invalid(parsed.error)
    if (!(await deps.verifyTurnstile(parsed.data.turnstileToken, ip)))
      return HUMAN_CHECK_FAILED

    if (await deps.users.findByEmail(parsed.data.email)) return OK

    await deps.users.create(
      parsed.data.email,
      await deps.hashPassword(parsed.data.password)
    )
    const token = await issueToken(
      "verify-email",
      parsed.data.email,
      VERIFY_TTL_MS
    )
    await deps.mailer.sendVerification(parsed.data.email, token)
    return OK
  }

  const verifyEmail = async (token: string): Promise<AccountResult> => {
    const stored = await deps.tokens.consume(
      "verify-email",
      hashToken(token),
      deps.clock()
    )
    if (!stored)
      return {
        ok: false,
        error: "This verification link is invalid or has expired.",
      }
    await deps.users.markVerified(stored.email, deps.clock())
    return OK
  }

  const resendVerification = async (raw: unknown): Promise<AccountResult> => {
    const parsed = z.object({ email }).safeParse(raw)
    if (!parsed.success) return invalid(parsed.error)
    const user = await deps.users.findByEmail(parsed.data.email)
    if (!user || user.emailVerified) return OK

    const token = await issueToken("verify-email", user.email, VERIFY_TTL_MS)
    await deps.mailer.sendVerification(user.email, token)
    return OK
  }

  const requestPasswordReset = async (
    raw: unknown,
    ip: string
  ): Promise<AccountResult> => {
    const parsed = resetRequestSchema.safeParse(raw)
    if (!parsed.success) return invalid(parsed.error)
    if (!(await deps.verifyTurnstile(parsed.data.turnstileToken, ip)))
      return HUMAN_CHECK_FAILED

    const user = await deps.users.findByEmail(parsed.data.email)
    if (!user) return OK

    const token = await issueToken("reset-password", user.email, RESET_TTL_MS)
    await deps.mailer.sendPasswordReset(user.email, token)
    return OK
  }

  const resetPassword = async (raw: unknown): Promise<AccountResult> => {
    const parsed = resetSchema.safeParse(raw)
    if (!parsed.success) return invalid(parsed.error)

    const stored = await deps.tokens.consume(
      "reset-password",
      hashToken(parsed.data.token),
      deps.clock()
    )
    if (!stored)
      return { ok: false, error: "This reset link is invalid or has expired." }

    await deps.users.setPassword(
      stored.email,
      await deps.hashPassword(parsed.data.password)
    )
    await deps.users.markVerified(stored.email, deps.clock())
    return OK
  }

  const changePassword = async (
    address: string,
    raw: unknown
  ): Promise<AccountResult> => {
    const parsed = changePasswordSchema.safeParse(raw)
    if (!parsed.success) return invalid(parsed.error)
    const user = await deps.users.findByEmail(address)
    const matches = user?.passwordHash
      ? await deps.verifyPassword(
          parsed.data.currentPassword,
          user.passwordHash
        )
      : false
    if (!matches)
      return {
        ok: false,
        error: "Your current password is incorrect.",
        field: "currentPassword",
      }
    await deps.users.setPassword(
      address,
      await deps.hashPassword(parsed.data.password)
    )
    return OK
  }

  return {
    register,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    changePassword,
  }
}
