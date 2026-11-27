import { describe, expect, it } from "vitest"

import { buildInvoice, buildLineItem } from "../domain/test-factories"
import {
  draftFromInvoice,
  editorToDraft,
  lineFromCatalog,
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
  dueDate: "",
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

describe("catalog lines and server-matching validation", () => {
  const option = {
    id: "eng",
    name: "Engineering",
    categoryId: null,
    categoryName: null,
    currency: "USD" as const,
    hourly: true,
    unitAmount: 15_000,
    priceLabel: "$150.00 / hour",
  }

  it("builds an hourly line from a catalog service", () => {
    expect(lineFromCatalog(option, "k")).toEqual({
      key: "k",
      description: "Engineering",
      quantity: "1",
      unitPrice: "150.00",
      unit: "hour",
    })
    expect(
      lineFromCatalog({ ...option, hourly: false }, "k")
    ).not.toHaveProperty("unit")
  })

  it("leaves the price empty when an hourly service has no rate yet", () => {
    expect(
      lineFromCatalog({ ...option, unitAmount: null }, "k").unitPrice
    ).toBe("")
  })

  it("ignores an untouched starter line so an empty draft can be saved", () => {
    const result = editorToDraft(
      state({
        lineItems: [
          { key: "a", description: "", quantity: "1", unitPrice: "" },
        ],
      })
    )
    expect(result).toMatchObject({ ok: true, value: { lineItems: [] } })
  })

  it.each([
    ["1.555", "quantity can have at most two decimal places."],
    ["1000001", "quantity is too large."],
    ["", "quantity must be above zero."],
  ])("rejects quantity %s like the server does", (quantity, message) => {
    expect(
      editorToDraft(
        state({
          lineItems: [
            { key: "a", description: "Build", quantity, unitPrice: "100" },
          ],
        })
      )
    ).toEqual({ ok: false, error: `Check line 1: ${message}` })
  })

  it("accepts quantities with two decimals", () => {
    const result = editorToDraft(
      state({
        lineItems: [
          { key: "a", description: "Build", quantity: "0.29", unitPrice: "1" },
        ],
      })
    )
    expect(result.ok && result.value.lineItems[0]?.quantity).toBe(0.29)
  })

  it("rejects descriptions the server would reject", () => {
    expect(
      editorToDraft(
        state({
          lineItems: [
            {
              key: "a",
              description: "x".repeat(501),
              quantity: "1",
              unitPrice: "1",
            },
          ],
        })
      )
    ).toEqual({
      ok: false,
      error: "Check line 1: keep the description under 500 characters.",
    })
  })

  it("keeps the hourly unit through a save and reload", () => {
    const result = editorToDraft(
      state({ lineItems: [{ ...lineFromCatalog(option, "a"), quantity: "3" }] })
    )
    if (!result.ok) throw new Error(result.error)
    expect(result.value.lineItems).toEqual([
      {
        description: "Engineering",
        quantity: 3,
        unitAmount: 15_000,
        unit: "hour",
      },
    ])
    const reloaded = draftFromInvoice(
      buildInvoice({ lineItems: result.value.lineItems })
    )
    expect(reloaded.lineItems[0]).toMatchObject({ quantity: "3", unit: "hour" })
  })
})
