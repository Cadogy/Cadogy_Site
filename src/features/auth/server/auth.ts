import "server-only"

import { mongodbAdapter } from "@better-auth/mongo-adapter"
import { passkey } from "@better-auth/passkey"
import { betterAuth } from "better-auth"
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api"
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
  sendMagicLinkDeclinedEmail,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email"
import { clientContext } from "@/lib/security/request-context"
import { verifyTurnstile } from "@/lib/security/turnstile"

import {
  changesFactors,
  mayChangeFactors,
  sessionAssurance,
  upgradesSession,
} from "../domain/assurance"
import { AUTH_COOKIE_PREFIX, TURNSTILE_HEADER } from "../domain/http"
import { PASSWORD_LENGTH } from "../domain/passwords"
import { toRole } from "../domain/permissions"
import { shouldBecomeOwner } from "../domain/roles"
import { eventForAuthRequest, isSignInEvent } from "../domain/security-events"
import { accessControl, authRoles } from "./access"
import { deletionEligibility } from "./account-deletion"
import {
  authDb,
  authMongoClient,
  countOwners,
  findUserById,
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

const signInEmail = (body: unknown) =>
  typeof body === "object" &&
  body !== null &&
  "email" in body &&
  typeof body.email === "string"
    ? body.email
    : ""

/** TOTP plus passkeys: every second factor on the account. */
const factorCount = async (userId: string) => {
  const _id = userObjectId(userId)
  if (!_id) return 0
  const [user, passkeys] = await Promise.all([
    findUserById(userId),
    authDb.collection("passkey").countDocuments({ userId: _id }),
  ])
  return (user?.twoFactorEnabled ? 1 : 0) + passkeys
}

const FACTOR_PROOF_NEEDED =
  "To change your sign-in protection, sign out and sign back in with your password and current authenticator or passkey."

const beforeRequest = createAuthMiddleware(async (ctx) => {
  // The admin plugin's endpoints skip the app's own guards (step-up,
  // last-owner rule, security log), so they're only callable from our server
  // code via auth.api, never over HTTP.
  if (ctx.request && ctx.path.startsWith("/admin/"))
    throw new APIError("NOT_FOUND")
  if (changesFactors(ctx.path)) {
    const session = await getSessionFromCtx(ctx)
    if (
      session &&
      !mayChangeFactors({
        path: ctx.path,
        assurance: session.session.assurance === "multi" ? "multi" : "single",
        factorCount: await factorCount(session.user.id),
      })
    )
      throw new APIError("FORBIDDEN", { message: FACTOR_PROOF_NEEDED })
  }
  if (HUMAN_CHECK_PATHS.has(ctx.path)) {
    const token = ctx.headers?.get(TURNSTILE_HEADER) ?? ""
    if (!(await verifyTurnstile(token, clientContext(ctx.headers).ip)))
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
  const current = ctx.context.session
  if (
    ok &&
    !newSession &&
    current &&
    upgradesSession(ctx.path, await factorCount(current.user.id))
  )
    await upgradeCurrentSession(current.session.token)

  const type = eventForAuthRequest({
    path: ctx.path,
    ok,
    newSession: Boolean(newSession),
    signedIn: Boolean(ctx.context.session),
  })
  if (!type) return
  const userId = newSession?.user.id ?? ctx.context.session?.user.id ?? null
  const email = newSession?.user.email ?? ctx.context.session?.user.email
  const { ip, userAgent } = clientContext(ctx.headers)
  if (newSession && isSignInEvent(type))
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
  const ownerExists = (await countOwners()) > 0
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

const userHasTwoFactor = async (userId: string) =>
  Boolean((await findUserById(userId))?.twoFactorEnabled)

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
    minPasswordLength: PASSWORD_LENGTH.min,
    maxPasswordLength: PASSWORD_LENGTH.max,
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
        const decision = await deletionEligibility({
          email: user.email,
          role: toRole("role" in user ? user.role : undefined),
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
    cookiePrefix: AUTH_COOKIE_PREFIX,
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
        const user = await users().findOne({
          email: email.trim().toLowerCase(),
        })
        if (!user) return
        // A link would sign in without the authenticator or passkey, so
        // protected accounts are asked to sign in the usual way instead.
        if ((await factorCount(user._id.toHexString())) > 0)
          await sendMagicLinkDeclinedEmail(email)
        else await sendMagicLinkEmail(email, url)
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
