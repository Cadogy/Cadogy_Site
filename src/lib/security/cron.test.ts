// @vitest-environment node
import { describe, expect, it } from "vitest"

import { isAuthorizedCron } from "./cron"

const SECRET = "a-long-random-cron-secret-value"

describe("isAuthorizedCron", () => {
  it("accepts the bearer secret", () => {
    expect(isAuthorizedCron(`Bearer ${SECRET}`, SECRET)).toBe(true)
  })

  it("rejects a wrong or missing secret", () => {
    expect(isAuthorizedCron("Bearer nope", SECRET)).toBe(false)
    expect(isAuthorizedCron(null, SECRET)).toBe(false)
    expect(isAuthorizedCron(SECRET, SECRET)).toBe(false)
  })

  it("fails closed when no secret is configured", () => {
    expect(isAuthorizedCron("Bearer ", undefined)).toBe(false)
    expect(isAuthorizedCron("Bearer undefined", undefined)).toBe(false)
  })
})
