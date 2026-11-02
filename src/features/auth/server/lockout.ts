import "server-only"

import { sendAccountLockedNotice } from "@/lib/email"

import { createLockout, LOCKOUT } from "../application/lockout"
import { authDb, users } from "./database"
import { securityLog } from "./security-log"

type FailureDoc = { readonly email: string; readonly at: Date }

const failures = () => authDb.collection<FailureDoc>("sign_in_failures")

const ensureIndexes = (() => {
  let ready: Promise<unknown> | null = null
  return () =>
    (ready ??= Promise.all([
      failures().createIndex(
        { at: 1 },
        { expireAfterSeconds: LOCKOUT.windowMinutes * 60 }
      ),
      failures().createIndex({ email: 1, at: -1 }),
    ]).catch((error: unknown) => {
      ready = null
      throw error
    }))
})()

export const lockout = createLockout({
  repository: {
    add: async (email, at) => {
      await ensureIndexes()
      await failures().insertOne({ email, at })
    },
    countSince: (email, since) =>
      failures().countDocuments({ email, at: { $gte: since } }),
    clear: async (email) => {
      await failures().deleteMany({ email })
    },
  },
  clock: () => new Date(),
  onLocked: async (email) => {
    const account = await users().findOne({ email })
    if (!account) return
    await sendAccountLockedNotice(email)
    await securityLog.record({
      type: "account_locked",
      actorId: null,
      targetId: account._id.toHexString(),
      detail: `${LOCKOUT.maxFailures} failed password attempts`,
      ip: "",
      userAgent: "",
    })
  },
})
