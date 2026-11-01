import { z } from "zod"

export const AUTH_ERRORS = {
  invalid: "InvalidCredentials",
  unverified: "EmailNotVerified",
  verification: "VerificationFailed",
} as const

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
  turnstileToken: z.string().max(4096).default(""),
})

type StoredUser = {
  readonly id: string
  readonly name: string | null
  readonly email: string
  readonly image: string | null
  readonly role: "user" | "admin"
  readonly passwordHash: string | null
  readonly emailVerified: Date | null
}

type Dependencies = {
  readonly verifyTurnstile: (token: string, ip: string) => Promise<boolean>
  readonly findUserByEmail: (email: string) => Promise<StoredUser | null>
  readonly verifyPassword: (password: string, hash: string) => Promise<boolean>
}

export const authorizeCredentials = async (
  raw: unknown,
  ip: string,
  deps: Dependencies
) => {
  const parsed = credentialsSchema.safeParse(raw)
  if (!parsed.success) throw new Error(AUTH_ERRORS.invalid)
  const { email, password, turnstileToken } = parsed.data

  if (!(await deps.verifyTurnstile(turnstileToken, ip)))
    throw new Error(AUTH_ERRORS.verification)

  const user = await deps.findUserByEmail(email)
  const passwordMatches = user?.passwordHash
    ? await deps.verifyPassword(password, user.passwordHash)
    : false
  if (!user || !passwordMatches) throw new Error(AUTH_ERRORS.invalid)
  if (!user.emailVerified) throw new Error(AUTH_ERRORS.unverified)

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  }
}
