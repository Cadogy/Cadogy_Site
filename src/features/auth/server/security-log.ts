import "server-only"

import {
  createSecurityLog,
  type SecurityEvent,
  type SecurityEventRepository,
} from "../application/security-log"
import { authDb } from "./database"

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

const events = () => authDb.collection<SecurityEvent>("security_events")

const ensureIndexes = (() => {
  let ready: Promise<unknown> | null = null
  return () =>
    (ready ??= Promise.all([
      events().createIndex({ at: 1 }, { expireAfterSeconds: ONE_YEAR_SECONDS }),
      events().createIndex({ targetId: 1, at: -1 }),
    ]).catch((error: unknown) => {
      ready = null
      throw error
    }))
})()

const repository: SecurityEventRepository = {
  insert: async (event) => {
    await ensureIndexes()
    await events().insertOne({ ...event })
  },
  list: async ({ targetId, limit }) =>
    events()
      .find(targetId ? { targetId } : {}, { projection: { _id: 0 } })
      .sort({ at: -1 })
      .limit(limit ?? 200)
      .toArray(),
}

export const securityLog = createSecurityLog({
  repository,
  clock: () => new Date(),
})
