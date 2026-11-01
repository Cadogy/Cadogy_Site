const STORAGE_KEY = "cadogy:chunk-reload-at"
const COOLDOWN_MS = 10_000

const isChunkLoadError = (error: unknown) =>
  error instanceof Error &&
  (error.name === "ChunkLoadError" ||
    /Loading chunk [\w-]+ failed/i.test(error.message))

export const reloadOnceForChunkError = (
  error: unknown,
  storage: Storage,
  reload: () => void
) => {
  if (!isChunkLoadError(error)) return false
  const last = Number(storage.getItem(STORAGE_KEY) ?? 0)
  if (Date.now() - last < COOLDOWN_MS) return false
  storage.setItem(STORAGE_KEY, String(Date.now()))
  reload()
  return true
}
