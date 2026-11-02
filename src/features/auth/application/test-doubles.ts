import type { SecurityEvent, SecurityEventRepository } from "./security-log"

export const createInMemorySecurityEvents = (): SecurityEventRepository => {
  const events: SecurityEvent[] = []
  return {
    insert: async (event) => {
      events.push(event)
    },
    list: async ({ targetId, types, limit }) =>
      [...events]
        .reverse()
        .filter((event) => !targetId || event.targetId === targetId)
        .filter((event) => !types || types.includes(event.type))
        .slice(0, limit ?? events.length),
  }
}
