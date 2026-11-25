import { describe, expect, it } from "vitest"

import { creditNoteCounterKey, formatCreditNoteNumber } from "./numbering"

describe("credit note numbering", () => {
  it("counts credit notes per year, apart from invoices", () => {
    expect(creditNoteCounterKey(2026)).toBe("credit-note-2026")
  })

  it("formats a credit note number with a zero-padded sequence", () => {
    expect(formatCreditNoteNumber({ year: 2026, sequence: 3 })).toBe(
      "CN-2026-0003"
    )
    expect(formatCreditNoteNumber({ year: 2027, sequence: 12_345 })).toBe(
      "CN-2027-12345"
    )
  })
})
