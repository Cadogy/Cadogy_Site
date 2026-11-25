import { describe, expect, it, vi } from "vitest"

import { onceUntilFailure } from "./once"

describe("onceUntilFailure", () => {
  it("runs the task once and shares its result", async () => {
    const task = vi.fn(async () => "ready")
    const run = onceUntilFailure(task)

    await Promise.all([run(), run()])
    await run()

    expect(task).toHaveBeenCalledTimes(1)
  })

  it("tries again after the task fails", async () => {
    const task = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValue("ready")
    const run = onceUntilFailure(task)

    await expect(run()).rejects.toThrow("down")
    await expect(run()).resolves.toBe("ready")
    expect(task).toHaveBeenCalledTimes(2)
  })
})
