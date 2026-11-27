import "server-only"

import { database } from "@/lib/mongodb"
import { onceUntilFailure } from "@/lib/once"

import {
  createSecurityLog,
  type SecurityEvent,
  type SecurityEventRepository,
} from "../application/security-log"

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

const events = () => database().collection<SecurityEvent>("security_events")

const ensureIndexes = onceUntilFailure(() =>
  Promise.all([
    events().createIndex({ at: 1 }, { expireAfterSeconds: ONE_YEAR_SECONDS }),
    events().createIndex({ targetId: 1, at: -1 }),
  ])
)

const repository: SecurityEventRepository = {
  insert: async (event) => {
    await ensureIndexes()
    await events().insertOne({ ...event })
  },
  list: async ({ targetId, types, limit }) =>
    events()
      .find(
        {
          ...(targetId ? { targetId } : {}),
          ...(types ? { type: { $in: [...types] } } : {}),
        },
        { projection: { _id: 0 } }
      )
      .sort({ at: -1 })
      .limit(limit ?? 200)
      .toArray(),
}

export const securityLog = createSecurityLog({
  repository,
  clock: () => new Date(),
})
