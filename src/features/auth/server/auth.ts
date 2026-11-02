import "server-only"

import { mongodbAdapter } from "@better-auth/mongo-adapter"
import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins/admin"
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned"

import { env } from "@/env"
import {
  sendExistingAccountNotice,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email"
import { verifyTurnstile } from "@/lib/security/turnstile"

import { TURNSTILE_HEADER } from "../domain/http"
import { shouldBecomeOwner } from "../domain/roles"
import { eventForAuthRequest } from "../domain/security-events"
import { accessControl, authRoles } from "./access"
import {
  authDb,
  authMongoClient,
  supportsTransactions,
  userObjectId,
  users,
} from "./database"
import { securityLog } from "./security-log"

const isProduction = process.env.NODE_ENV === "production"
const MINUTE = 60
const DAY = 24 * 60 * MINUTE

const HUMAN_CHECK_PATHS = new Set([
  "/sign-up/email",
  "/sign-in/email",
  "/request-password-reset",
])

const requestIp = (headers: Headers | undefined) =>
  headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  headers?.get("x-real-ip") ||
  ""

const requireHuman = createAuthMiddleware(async (ctx) => {
  if (!HUMAN_CHECK_PATHS.has(ctx.path)) return
  const token = ctx.headers?.get(TURNSTILE_HEADER) ?? ""
  if (!(await verifyTurnstile(token, requestIp(ctx.headers))))
    throw new APIError("BAD_REQUEST", {
      message: "We couldn't verify you're human. Please try again.",
    })
})

const recordSecurityEvent = createAuthMiddleware(async (ctx) => {
  const ok = !(ctx.context.returned instanceof APIError)
  const type = eventForAuthRequest({ path: ctx.path, ok })
  if (!type) return
  const userId =
    ctx.context.newSession?.user.id ?? ctx.context.session?.user.id ?? null
  await securityLog.record({
    type,
    actorId: userId,
    targetId: userId,
    detail: ok ? undefined : "Wrong email or password",
    ip: requestIp(ctx.headers),
    userAgent: ctx.headers?.get("user-agent") ?? "",
  })
})

const promoteOwnerIfConfigured = async (user: {
  readonly id: string
  readonly email: string
  readonly emailVerified: boolean
  readonly role?: string | null
}) => {
  const id = userObjectId(user.id)
  if (!id || user.role === "owner") return
  const ownerExists = (await users().countDocuments({ role: "owner" })) > 0
  const promote = shouldBecomeOwner({
    email: user.email,
    emailVerified: user.emailVerified,
    ownerEmail: env.OWNER_EMAIL,
    ownerExists,
  })
  if (!promote) return
  await users().updateOne({ _id: id }, { $set: { role: "owner" } })
  await securityLog.record({
    type: "owner_bootstrapped",
    actorId: null,
    targetId: user.id,
    detail: "First verified account for OWNER_EMAIL",
    ip: "",
    userAgent: "",
  })
}

export const auth = betterAuth({
  appName: "Cadogy",
  baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  database: mongodbAdapter(
    authDb,
    supportsTransactions ? { client: authMongoClient } : undefined
  ),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * MINUTE,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url)
    },
    onExistingUserSignUp: async ({ user }) => {
      await sendExistingAccountNotice(user.email)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: DAY,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail(user.email, url)
    },
  },
  session: {
    expiresIn: 7 * DAY,
    updateAge: DAY,
    freshAge: 10 * MINUTE,
  },
  rateLimit: {
    enabled: isProduction,
    storage: "database",
    window: MINUTE,
    max: 60,
    customRules: {
      "/sign-in/email": { window: MINUTE, max: 5 },
      "/sign-up/email": { window: 60 * MINUTE, max: 3 },
      "/request-password-reset": { window: 15 * MINUTE, max: 3 },
      "/send-verification-email": { window: 15 * MINUTE, max: 3 },
      "/reset-password": { window: 15 * MINUTE, max: 5 },
      "/change-password": { window: 15 * MINUTE, max: 5 },
    },
  },
  advanced: {
    useSecureCookies: isProduction,
    cookiePrefix: "cadogy",
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
  },
  hooks: {
    before: requireHuman,
    after: recordSecurityEvent,
  },
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          await promoteOwnerIfConfigured(user)
        },
      },
    },
  },
  plugins: [
    admin({
      ac: accessControl,
      roles: authRoles,
      defaultRole: "client",
      adminRoles: ["owner", "admin"],
    }),
    haveIBeenPwned({
      enabled: isProduction,
      customPasswordCompromisedMessage:
        "This password has appeared in a data breach. Please choose a different one.",
    }),
    nextCookies(),
  ],
})
