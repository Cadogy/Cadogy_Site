import { describe, expect, it } from "vitest"

import { toState } from "./action-state"

describe("toState", () => {
  it("reports success with the message you choose", () => {
    expect(toState({ ok: true }, "Saved.")).toEqual({
      ok: true,
      message: "Saved.",
    })
  })

  it("passes a failure's error through as the message", () => {
    expect(toState({ ok: false, error: "Not allowed" }, "Saved.")).toEqual({
      ok: false,
      message: "Not allowed",
    })
  })
})
