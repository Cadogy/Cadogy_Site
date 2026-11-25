// @vitest-environment node
import { describe, expect, it } from "vitest"

import { hasBearerSecret } from "./bearer-secret"

const SECRET = "a-long-random-cron-secret-value"

describe("hasBearerSecret", () => {
  it("accepts the bearer secret", () => {
    expect(hasBearerSecret(`Bearer ${SECRET}`, SECRET)).toBe(true)
  })

  it("rejects a wrong or missing secret", () => {
    expect(hasBearerSecret("Bearer nope", SECRET)).toBe(false)
    expect(hasBearerSecret(null, SECRET)).toBe(false)
    expect(hasBearerSecret(SECRET, SECRET)).toBe(false)
  })

  it("fails closed when no secret is configured", () => {
    expect(hasBearerSecret("Bearer ", undefined)).toBe(false)
    expect(hasBearerSecret("Bearer undefined", undefined)).toBe(false)
  })
})
