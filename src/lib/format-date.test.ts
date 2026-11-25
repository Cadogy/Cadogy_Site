import { describe, expect, it } from "vitest"

import { formatDateTimeUtc, formatDayUtc } from "./format-date"

const at = new Date("2026-11-24T18:05:00Z")

describe("UTC date formatting", () => {
  it("shows a date and time in UTC, labeled so", () => {
    expect(formatDateTimeUtc(at)).toBe("Nov 24, 2026, 6:05 PM UTC")
  })

  it("shows just the day", () => {
    expect(formatDayUtc(at)).toBe("Nov 24, 2026")
  })
})
