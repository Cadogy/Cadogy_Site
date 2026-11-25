export const onceUntilFailure = <T>(task: () => Promise<T>) => {
  let pending: Promise<T> | null = null
  return () =>
    (pending ??= task().catch((error: unknown) => {
      pending = null
      throw error
    }))
}
