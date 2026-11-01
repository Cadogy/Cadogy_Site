import { describe, expect, it, vi } from "vitest"

import { reloadOnceForChunkError } from "./chunk-reload"

const chunkError = Object.assign(new Error("Loading chunk 123 failed."), {
  name: "ChunkLoadError",
})

describe("reloadOnceForChunkError", () => {
  it("reloads once for a stale deployment chunk", () => {
    const reload = vi.fn()
    expect(
      reloadOnceForChunkError(chunkError, window.sessionStorage, reload)
    ).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it("does not loop when the reload did not help", () => {
    const reload = vi.fn()
    window.sessionStorage.clear()
    reloadOnceForChunkError(chunkError, window.sessionStorage, reload)
    reloadOnceForChunkError(chunkError, window.sessionStorage, reload)
    expect(reload).toHaveBeenCalledOnce()
  })

  it("ignores ordinary errors", () => {
    const reload = vi.fn()
    expect(
      reloadOnceForChunkError(new Error("boom"), window.sessionStorage, reload)
    ).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})
