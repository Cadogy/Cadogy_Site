import { parseMoneyInput } from "../domain/format"
import { fail, ok, type Invoice, type Result } from "../domain/invoice"
import type {
  Currency,
  Discount,
  InvoiceDraftInput,
  LineItem,
} from "../domain/schema"

export type EditorLine = {
  readonly key: string
  readonly description: string
  readonly quantity: string
  readonly unitPrice: string
}

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
}

const PERCENT_PATTERN = /^\d+(\.\d{1,2})?$/

const parsePercentToBps = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === "") return 0
  if (!PERCENT_PATTERN.test(trimmed)) return null
  const bps = Math.round(Number(trimmed) * 100)
  return bps <= 10_000 ? bps : null
}

const isBlankLine = (line: EditorLine) =>
  !line.description.trim() && !line.quantity.trim() && !line.unitPrice.trim()

const parseLine = (line: EditorLine, index: number): Result<LineItem> => {
  const quantity = Number(line.quantity)
  const unitAmount = parseMoneyInput(line.unitPrice)
  const label = `Check line ${index + 1}`
  if (!line.description.trim()) return fail(`${label}: add a description.`)
  if (!Number.isFinite(quantity) || quantity <= 0)
    return fail(`${label}: quantity must be above zero.`)
  if (unitAmount === null) return fail(`${label}: enter a valid unit price.`)
  return ok({ description: line.description.trim(), quantity, unitAmount })
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

export const editorToDraft = (
  state: EditorState
): Result<InvoiceDraftInput> => {
  const lines = state.lineItems
    .filter((line) => !isBlankLine(line))
    .map(parseLine)
  const badLine = lines.find((line) => !line.ok)
  if (badLine && !badLine.ok) return fail(badLine.error)

  const discount = parseDiscount(state)
  if (!discount.ok) return discount

  const taxRateBps = parsePercentToBps(state.taxRate)
  if (taxRateBps === null)
    return fail("Tax rate must be a percentage between 0 and 100.")

  const termsDays = Number(state.termsDays)
  if (!Number.isInteger(termsDays) || termsDays < 0 || termsDays > 120)
    return fail("Payment terms must be between 0 and 120 days.")

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
  })
}

const centsToText = (minorUnits: number) => (minorUnits / 100).toFixed(2)
const bpsToText = (bps: number) => (bps === 0 ? "" : String(bps / 100))

export const draftFromInvoice = (invoice: Invoice): EditorState => ({
  clientId: invoice.clientId,
  currency: invoice.currency,
  termsDays: String(invoice.termsDays),
  lineItems: invoice.lineItems.map((item, index) => ({
    key: `line-${index}`,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: centsToText(item.unitAmount),
  })),
  discountType: invoice.discount?.type ?? "none",
  discountValue: invoice.discount
    ? invoice.discount.type === "percent"
      ? bpsToText(invoice.discount.value)
      : centsToText(invoice.discount.value)
    : "",
  taxRate: bpsToText(invoice.taxRateBps),
  memo: invoice.memo,
  footer: invoice.footer,
  internalNotes: invoice.internalNotes,
})
