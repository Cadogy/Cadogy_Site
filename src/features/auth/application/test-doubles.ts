import type { SecurityEvent, SecurityEventRepository } from "./security-log"

export const createInMemorySecurityEvents = (): SecurityEventRepository => {
  const events: SecurityEvent[] = []
  return {
    insert: async (event) => {
      events.push(event)
    },
    list: async ({ targetId, limit }) =>
      [...events]
        .reverse()
        .filter((event) => !targetId || event.targetId === targetId)
        .slice(0, limit ?? events.length),
  }
}
