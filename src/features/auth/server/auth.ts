import "server-only"

import { billing } from "@/features/billing/server/billing"
import { mongodbAdapter } from "@better-auth/mongo-adapter"
import { passkey } from "@better-auth/passkey"
import { betterAuth } from "better-auth"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins/admin"
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned"
import { magicLink } from "better-auth/plugins/magic-link"
import { twoFactor } from "better-auth/plugins/two-factor"

import { env } from "@/env"
import {
  sendDeleteAccountConfirmation,
  sendEmailChangeConfirmation,
  sendExistingAccountNotice,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email"
import { verifyTurnstile } from "@/lib/security/turnstile"

import { sessionAssurance, upgradesSession } from "../domain/assurance"
import { TURNSTILE_HEADER } from "../domain/http"
import { isStaff, toRole } from "../domain/permissions"
import { shouldBecomeOwner } from "../domain/roles"
import {
  eventForAuthRequest,
  type SecurityEventType,
} from "../domain/security-events"
import { canDeleteAccount } from "../domain/user-admin"
import { accessControl, authRoles } from "./access"
import {
  authDb,
  authMongoClient,
  supportsTransactions,
  userObjectId,
  users,
} from "./database"
import { lockout } from "./lockout"
import { sendEventNotice } from "./notices"
import { securityLog } from "./security-log"
import { alertIfUnfamiliar } from "./sign-in-alerts"

const isProduction = process.env.NODE_ENV === "production"
const MINUTE = 60
const DAY = 24 * 60 * MINUTE

const baseURL = env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL
const siteOrigin = new URL(baseURL).origin
const siteHost = new URL(baseURL).hostname
const passkeyRpId =
  siteHost === "localhost" ? "localhost" : siteHost.replace(/^www\./, "")

const HUMAN_CHECK_PATHS = new Set([
  "/sign-up/email",
  "/sign-in/email",
  "/request-password-reset",
  "/sign-in/magic-link",
])

const LOCKED_MESSAGE =
  "Too many failed attempts. Password sign-in is paused for 15 minutes. You can still sign in with a passkey or reset your password."

const requestIp = (headers: Headers | undefined) =>
  headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  headers?.get("x-real-ip") ||
  ""

const signInEmail = (body: unknown) =>
  typeof body === "object" &&
  body !== null &&
  "email" in body &&
  typeof body.email === "string"
    ? body.email
    : ""

const beforeRequest = createAuthMiddleware(async (ctx) => {
  if (HUMAN_CHECK_PATHS.has(ctx.path)) {
    const token = ctx.headers?.get(TURNSTILE_HEADER) ?? ""
    if (!(await verifyTurnstile(token, requestIp(ctx.headers))))
      throw new APIError("BAD_REQUEST", {
        message: "We couldn't verify you're human. Please try again.",
      })
  }
  if (ctx.path === "/sign-in/email") {
    const email = signInEmail(ctx.body)
    if (email && (await lockout.isLocked(email)))
      throw new APIError("TOO_MANY_REQUESTS", { message: LOCKED_MESSAGE })
  }
})

const trackPasswordAttempt = async (
  path: string,
  body: unknown,
  ok: boolean
) => {
  if (path !== "/sign-in/email") return
  const email = signInEmail(body)
  if (!email) return
  if (ok) await lockout.clear(email)
  else await lockout.recordFailure(email)
}

const upgradeCurrentSession = async (token: string | undefined) => {
  if (!token) return
  await authDb
    .collection("session")
    .updateOne({ token }, { $set: { assurance: "multi" } })
}

const afterRequest = createAuthMiddleware(async (ctx) => {
  const returned = ctx.context.returned
  const ok = !(returned instanceof APIError)
  const locked =
    returned instanceof APIError && returned.message === LOCKED_MESSAGE
  if (!locked) await trackPasswordAttempt(ctx.path, ctx.body, ok)

  const newSession = ctx.context.newSession
  if (ok && !newSession && upgradesSession(ctx.path))
    await upgradeCurrentSession(ctx.context.session?.session.token)

  const type = eventForAuthRequest({
    path: ctx.path,
    ok,
    newSession: Boolean(newSession),
    signedIn: Boolean(ctx.context.session),
  })
  if (!type) return
  const userId = newSession?.user.id ?? ctx.context.session?.user.id ?? null
  const email = newSession?.user.email ?? ctx.context.session?.user.email
  const ip = requestIp(ctx.headers)
  const userAgent = ctx.headers?.get("user-agent") ?? ""
  if (newSession && SIGN_IN_EVENTS.has(type))
    await quietly(() =>
      alertIfUnfamiliar({
        userId: newSession.user.id,
        email: newSession.user.email,
        ip,
        userAgent,
      })
    )
  if (email) await quietly(() => sendEventNotice(email, type))
  await securityLog.record({
    type,
    actorId: userId,
    targetId: userId,
    detail: ok ? undefined : locked ? "Blocked while locked" : undefined,
    ip,
    userAgent,
  })
})

const openInvoicesFor = async (email: string) =>
  (await billing.listForPortalUser(email)).filter(
    (invoice) => invoice.status === "open"
  ).length

const SIGN_IN_EVENTS = new Set<SecurityEventType>([
  "sign_in",
  "sign_in_backup_code",
  "sign_in_passkey",
  "sign_in_magic_link",
])

const quietly = async (task: () => Promise<void>) => {
  try {
    await task()
  } catch (error) {
    console.error("Security notice failed", error)
  }
}

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

const userHasTwoFactor = async (userId: string) => {
  const id = userObjectId(userId)
  const user = id ? await users().findOne({ _id: id }) : null
  return Boolean(user?.twoFactorEnabled)
}

export const auth = betterAuth({
  appName: "Cadogy",
  baseURL,
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
    onPasswordReset: async ({ user }) => {
      await quietly(() => sendEventNotice(user.email, "password_reset"))
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendEmailChangeConfirmation(user.email, newEmail, url)
      },
    },
    deleteUser: {
      enabled: true,
      deleteTokenExpiresIn: 60 * MINUTE,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendDeleteAccountConfirmation(user.email, url)
      },
      beforeDelete: async (user) => {
        const role = toRole("role" in user ? user.role : undefined)
        const decision = canDeleteAccount({
          role,
          openInvoices: isStaff(role) ? 0 : await openInvoicesFor(user.email),
        })
        if (!decision.ok)
          throw new APIError("BAD_REQUEST", { message: decision.error })
      },
      afterDelete: async (user) => {
        await securityLog.record({
          type: "account_deleted",
          actorId: user.id,
          targetId: user.id,
          detail: user.email,
          ip: "",
          userAgent: "",
        })
      },
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
    additionalFields: {
      assurance: {
        type: "string",
        defaultValue: "single",
        input: false,
      },
    },
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
      "/two-factor/verify-totp": { window: MINUTE, max: 5 },
      "/two-factor/verify-backup-code": { window: MINUTE, max: 5 },
      "/passkey/verify-authentication": { window: MINUTE, max: 10 },
      "/sign-in/magic-link": { window: 15 * MINUTE, max: 3 },
      "/magic-link/verify": { window: MINUTE, max: 10 },
    },
  },
  advanced: {
    useSecureCookies: isProduction,
    cookiePrefix: "cadogy",
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
  },
  hooks: {
    before: beforeRequest,
    after: afterRequest,
  },
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          await promoteOwnerIfConfigured(user)
        },
      },
    },
    session: {
      create: {
        before: async (session, ctx) => ({
          data: {
            ...session,
            assurance: sessionAssurance({
              path: ctx?.path,
              userHasTwoFactor: await userHasTwoFactor(session.userId),
            }),
          },
        }),
      },
    },
  },
  plugins: [
    admin({
      ac: accessControl,
      roles: authRoles,
      defaultRole: "client",
      adminRoles: ["owner", "admin"],
      impersonationSessionDuration: 30 * MINUTE,
      bannedUserMessage:
        "This account has been suspended. Reply to any email from us if you think this is a mistake.",
    }),
    twoFactor({ issuer: "Cadogy" }),
    magicLink({
      expiresIn: 15 * MINUTE,
      disableSignUp: true,
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        if (await users().findOne({ email: email.trim().toLowerCase() }))
          await sendMagicLinkEmail(email, url)
      },
    }),
    passkey({ rpID: passkeyRpId, rpName: "Cadogy", origin: siteOrigin }),
    haveIBeenPwned({
      enabled: isProduction,
      customPasswordCompromisedMessage:
        "This password has appeared in a data breach. Please choose a different one.",
    }),
    nextCookies(),
  ],
})
