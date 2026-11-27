import { fail, ok, type Result } from "@/lib/result"

import {
  bpsToPercentText,
  parseMoneyInput,
  parsePercentToBps,
  toMoneyInput,
} from "../domain/format"
import { type Invoice } from "../domain/invoice"
import {
  MAX_LINE_ITEMS,
  type Currency,
  type Discount,
  type InvoiceDraftPayload,
  type LineItem,
  type LineUnit,
} from "../domain/schema"

export type EditorLine = {
  readonly key: string
  readonly description: string
  readonly quantity: string
  readonly unitPrice: string
  readonly unit?: LineUnit
}

/** A catalog service as the invoice editor offers it, priced in its currency. */
export type CatalogOption = {
  readonly id: string
  readonly name: string
  readonly categoryId: string | null
  readonly categoryName: string | null
  readonly currency: Currency
  readonly hourly: boolean
  /** Null when an hourly service has no rate it can use yet. */
  readonly unitAmount: number | null
}

const MAX_DESCRIPTION = 500
const MAX_QUANTITY = 1_000_000

const hasAtMostTwoDecimals = (value: number) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6

export const lineFromCatalog = (
  option: CatalogOption,
  key: string
): EditorLine => ({
  key,
  description: option.name,
  quantity: "1",
  unitPrice: option.unitAmount === null ? "" : toMoneyInput(option.unitAmount),
  ...(option.hourly ? { unit: "hour" as const } : {}),
})

export type EditorState = {
  readonly clientId: string
  readonly currency: Currency
  readonly termsDays: string
  readonly lineItems: readonly EditorLine[]
  readonly discountType: "none" | "percent" | "amount"
  readonly discountValue: string
  readonly taxRate: string
  readonly memo: string
  readonly footer: string
  readonly internalNotes: string
  /** YYYY-MM-DD, or empty to use the payment terms. */
  readonly dueDate: string
}

/**
 * A line with no description and no price is untouched, whatever its
 * quantity: new lines start at quantity 1, and that alone shouldn't block
 * saving or count as a line.
 */
export const isBlankLine = (line: EditorLine) =>
  !line.description.trim() && !line.unitPrice.trim()

const parseLine = (line: EditorLine, index: number): Result<LineItem> => {
  const quantity = Number(line.quantity)
  const unitAmount = parseMoneyInput(line.unitPrice)
  const label = `Check line ${index + 1}`
  const description = line.description.trim()
  if (!description) return fail(`${label}: add a description.`)
  if (description.length > MAX_DESCRIPTION)
    return fail(
      `${label}: keep the description under ${MAX_DESCRIPTION} characters.`
    )
  if (!line.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0)
    return fail(`${label}: quantity must be above zero.`)
  if (quantity > MAX_QUANTITY) return fail(`${label}: quantity is too large.`)
  if (!hasAtMostTwoDecimals(quantity))
    return fail(`${label}: quantity can have at most two decimal places.`)
  if (unitAmount === null) return fail(`${label}: enter a valid unit price.`)
  return ok({
    description,
    quantity,
    unitAmount,
    ...(line.unit ? { unit: line.unit } : {}),
  })
}

const parseDiscount = (state: EditorState): Result<Discount | null> => {
  if (state.discountType === "none") return ok(null)
  if (state.discountType === "percent") {
    const bps = parsePercentToBps(state.discountValue)
    return bps === null
      ? fail("Discount must be a percentage between 0 and 100.")
      : ok({ type: "percent", value: bps })
  }
  const amount = parseMoneyInput(state.discountValue)
  return amount === null
    ? fail("Discount must be a valid amount.")
    : ok({ type: "amount", value: amount })
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

export const editorToDraft = (
  state: EditorState
): Result<InvoiceDraftPayload> => {
  const lines = state.lineItems
    .filter((line) => !isBlankLine(line))
    .map(parseLine)
  const badLine = lines.find((line) => !line.ok)
  if (badLine && !badLine.ok) return fail(badLine.error)
  if (lines.length > MAX_LINE_ITEMS)
    return fail(`An invoice can have at most ${MAX_LINE_ITEMS} lines.`)

  const discount = parseDiscount(state)
  if (!discount.ok) return discount

  const taxRateBps = parsePercentToBps(state.taxRate)
  if (taxRateBps === null)
    return fail("Tax rate must be a percentage between 0 and 100.")

  const termsDays = Number(state.termsDays)
  if (!Number.isInteger(termsDays) || termsDays < 0 || termsDays > 120)
    return fail("Payment terms must be between 0 and 120 days.")

  const dueDate = state.dueDate.trim()
  if (dueDate && !ISO_DAY.test(dueDate)) return fail("Enter a valid due date.")

  return ok({
    clientId: state.clientId,
    currency: state.currency,
    termsDays,
    lineItems: lines.flatMap((line) => (line.ok ? [line.value] : [])),
    discount: discount.value,
    taxRateBps,
    memo: state.memo,
    footer: state.footer,
    internalNotes: state.internalNotes,
    dueDate: dueDate || null,
  })
}

const bpsToText = (bps: number) => (bps === 0 ? "" : bpsToPercentText(bps))

export const draftFromInvoice = (invoice: Invoice): EditorState => ({
  clientId: invoice.clientId,
  currency: invoice.currency,
  termsDays: String(invoice.termsDays),
  lineItems: invoice.lineItems.map((item, index) => ({
    key: `line-${index}`,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: toMoneyInput(item.unitAmount),
    ...(item.unit ? { unit: item.unit } : {}),
  })),
  discountType: invoice.discount?.type ?? "none",
  discountValue: invoice.discount
    ? invoice.discount.type === "percent"
      ? bpsToText(invoice.discount.value)
      : toMoneyInput(invoice.discount.value)
    : "",
  taxRate: bpsToText(invoice.taxRateBps),
  memo: invoice.memo,
  footer: invoice.footer,
  internalNotes: invoice.internalNotes,
  dueDate: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : "",
})
