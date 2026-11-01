import { describe, expect, it } from "vitest"

import { buildInvoice, buildLineItem } from "../domain/test-factories"
import {
  draftFromInvoice,
  editorToDraft,
  type EditorState,
} from "./editor-model"

const state = (overrides: Partial<EditorState> = {}): EditorState => ({
  clientId: "c1",
  currency: "USD",
  termsDays: "15",
  lineItems: [
    {
      key: "a",
      description: "Design sprint",
      quantity: "2",
      unitPrice: "$1,500.00",
    },
  ],
  discountType: "none",
  discountValue: "",
  taxRate: "",
  memo: "",
  footer: "",
  internalNotes: "",
  ...overrides,
})

describe("editorToDraft", () => {
  it("converts typed amounts into minor units", () => {
    expect(editorToDraft(state())).toEqual({
      ok: true,
      value: expect.objectContaining({
        clientId: "c1",
        termsDays: 15,
        lineItems: [
          { description: "Design sprint", quantity: 2, unitAmount: 150_000 },
        ],
        discount: null,
        taxRateBps: 0,
      }),
    })
  })

  it("converts percentage discounts and tax rates into basis points", () => {
    const result = editorToDraft(
      state({ discountType: "percent", discountValue: "12.5", taxRate: "7" })
    )
    expect(result.ok && result.value.discount).toEqual({
      type: "percent",
      value: 1_250,
    })
    expect(result.ok && result.value.taxRateBps).toBe(700)
  })

  it("converts fixed discounts into minor units", () => {
    const result = editorToDraft(
      state({ discountType: "amount", discountValue: "250" })
    )
    expect(result.ok && result.value.discount).toEqual({
      type: "amount",
      value: 25_000,
    })
  })

  it("ignores completely empty line rows", () => {
    const result = editorToDraft(
      state({
        lineItems: [
          { key: "a", description: "Build", quantity: "1", unitPrice: "100" },
          { key: "b", description: "", quantity: "", unitPrice: "" },
        ],
      })
    )
    expect(result.ok && result.value.lineItems).toHaveLength(1)
  })

  it.each([
    [
      {
        lineItems: [
          { key: "a", description: "Build", quantity: "1", unitPrice: "abc" },
        ],
      },
      "line 1",
    ],
    [
      {
        lineItems: [
          { key: "a", description: "", quantity: "1", unitPrice: "10" },
        ],
      },
      "line 1",
    ],
    [
      {
        lineItems: [
          { key: "a", description: "Build", quantity: "0", unitPrice: "10" },
        ],
      },
      "line 1",
    ],
    [{ taxRate: "150" }, "Tax"],
    [{ discountType: "percent" as const, discountValue: "-1" }, "Discount"],
  ])("explains what is wrong with invalid input", (overrides, mention) => {
    const result = editorToDraft(state(overrides))
    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining(mention),
    })
  })
})

describe("draftFromInvoice", () => {
  it("round-trips a stored draft into editable text", () => {
    const editor = draftFromInvoice(
      buildInvoice({
        lineItems: [
          buildLineItem({
            description: "Retainer",
            quantity: 1.5,
            unitAmount: 123_450,
          }),
        ],
        discount: { type: "percent", value: 1_000 },
        taxRateBps: 825,
      })
    )
    expect(editor.lineItems[0]).toMatchObject({
      description: "Retainer",
      quantity: "1.5",
      unitPrice: "1234.50",
    })
    expect(editor.discountType).toBe("percent")
    expect(editor.discountValue).toBe("10")
    expect(editor.taxRate).toBe("8.25")
    expect(editorToDraft(editor).ok).toBe(true)
  })
})
