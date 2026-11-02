import type { SecurityEventType } from "../domain/security-events"

export type SecurityEvent = {
  readonly type: SecurityEventType
  readonly actorId: string | null
  readonly targetId: string | null
  readonly detail?: string
  readonly ip: string
  readonly userAgent: string
  readonly at: Date
}

export type SecurityEventRepository = {
  readonly insert: (event: SecurityEvent) => Promise<void>
  readonly list: (filter: {
    readonly targetId?: string
    readonly types?: readonly SecurityEventType[]
    readonly limit?: number
  }) => Promise<SecurityEvent[]>
}

export const createSecurityLog = ({
  repository,
  clock,
}: {
  readonly repository: SecurityEventRepository
  readonly clock: () => Date
}) => {
  const record = async (event: Omit<SecurityEvent, "at">) => {
    try {
      await repository.insert({ ...event, at: clock() })
    } catch (error) {
      console.error(`Failed to record security event ${event.type}`, error)
    }
  }

  return {
    record,
    forUser: (userId: string, limit = 50) =>
      repository.list({ targetId: userId, limit }),
    recent: (types?: readonly SecurityEventType[], limit = 200) =>
      repository.list({ types, limit }),
  }
}
