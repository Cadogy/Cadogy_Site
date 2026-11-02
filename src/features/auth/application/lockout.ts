export const LOCKOUT = { maxFailures: 10, windowMinutes: 15 } as const

type FailureRepository = {
  readonly add: (email: string, at: Date) => Promise<void>
  readonly countSince: (email: string, since: Date) => Promise<number>
  readonly clear: (email: string) => Promise<void>
}

const normalize = (email: string) => email.trim().toLowerCase()

export const createLockout = ({
  repository,
  clock,
  onLocked,
}: {
  readonly repository: FailureRepository
  readonly clock: () => Date
  readonly onLocked: (email: string) => Promise<void>
}) => {
  const windowStart = () =>
    new Date(clock().getTime() - LOCKOUT.windowMinutes * 60_000)

  const failures = (email: string) =>
    repository.countSince(normalize(email), windowStart())

  const isLocked = async (email: string) =>
    (await failures(email)) >= LOCKOUT.maxFailures

  const recordFailure = async (email: string) => {
    await repository.add(normalize(email), clock())
    if ((await failures(email)) === LOCKOUT.maxFailures)
      await onLocked(normalize(email))
  }

  const clear = (email: string) => repository.clear(normalize(email))

  return { isLocked, recordFailure, clear }
}
