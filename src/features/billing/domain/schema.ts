import { z } from "zod"

import { CONTACT_ROLES } from "./contacts"
import type { InvoiceAdjustment } from "./invoice"

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const
export const INVOICE_STATUSES = [
  "draft",
  "open",
  "paid",
  "void",
  "uncollectible",
] as const
export const PAYMENT_METHODS = [
  "stripe",
  "bank_transfer",
  "check",
  "cash",
  "credit",
  "other",
] as const

const email = z.string().trim().toLowerCase().pipe(z.email())

export const minorUnits = z.number().int().nonnegative().max(1_000_000_000_00)

export const wholeQuantity = z.number().int().positive().max(10_000)

export const lineQuantity = z
  .number()
  .positive()
  .max(1_000_000)
  .refine((value) => Number.isInteger(Math.round(value * 100 * 1e6) / 1e6), {
    message: "Quantity supports at most two decimal places",
  })

export const LINE_UNITS = ["hour"] as const
export type LineUnit = (typeof LINE_UNITS)[number]

export const MAX_LINE_ITEMS = 100

export const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: lineQuantity,
  unitAmount: minorUnits,
  unit: z.enum(LINE_UNITS).optional(),
})

const discountSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("percent"),
    value: z.number().int().min(0).max(10_000),
  }),
  z.object({ type: z.literal("amount"), value: minorUnits }),
])

const addressSchema = z.object({
  line1: z.string().trim().max(200).default(""),
  line2: z.string().trim().max(200).default(""),
  city: z.string().trim().max(100).default(""),
  region: z.string().trim().max(100).default(""),
  postalCode: z.string().trim().max(20).default(""),
  country: z.string().trim().max(100).default(""),
})

export const clientInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200).default(""),
  email: email,
  address: addressSchema.default({
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
  }),
  taxId: z.string().trim().max(50).default(""),
  currency: z.enum(CURRENCIES).default("USD"),
  defaultTermsDays: z.number().int().min(0).max(120).default(15),
  notes: z.string().trim().max(2_000).default(""),
})

export const contactInputSchema = z.object({
  email: email,
  name: z.string().trim().max(120).default(""),
  role: z.enum(CONTACT_ROLES),
})

export const invoiceDraftInputSchema = z.object({
  clientId: z.string().min(1),
  currency: z.enum(CURRENCIES),
  termsDays: z.number().int().min(0).max(120),
  lineItems: z.array(lineItemSchema).max(MAX_LINE_ITEMS),
  discount: discountSchema.nullable().default(null),
  taxRateBps: z.number().int().min(0).max(10_000).default(0),
  memo: z.string().trim().max(2_000).default(""),
  footer: z.string().trim().max(1_000).default(""),
  internalNotes: z.string().trim().max(2_000).default(""),
  /** Fixed due date (YYYY-MM-DD) instead of issue date + payment terms. */
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD due date")
    .transform((value) => new Date(`${value}T00:00:00.000Z`))
    .nullable()
    .default(null),
})

export const paymentInputSchema = z.object({
  amount: minorUnits.positive(),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().trim().max(200).default(""),
  paidAt: z.coerce.date(),
})

export type Currency = (typeof CURRENCIES)[number]
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]
export type LineItem = z.infer<typeof lineItemSchema>
export type Discount = z.infer<typeof discountSchema>
export type Address = z.infer<typeof addressSchema>
export type ClientInput = z.infer<typeof clientInputSchema>
export type InvoiceDraftInput = z.infer<typeof invoiceDraftInputSchema>
/** What the editor sends: the same draft, with the due date still a string. */
export type InvoiceDraftPayload = Omit<InvoiceDraftInput, "dueDate"> & {
  readonly dueDate: string | null
}
type PaymentInput = z.infer<typeof paymentInputSchema>

export type Payment = PaymentInput & {
  readonly stripeEventId?: string
  readonly stripePaymentIntentId?: string
}

export type InvoiceAmounts = {
  readonly lineItems: readonly LineItem[]
  readonly discount: Discount | null
  readonly taxRateBps: number
  readonly payments: readonly Pick<Payment, "amount">[]
  readonly adjustments?: readonly Pick<InvoiceAdjustment, "kind" | "amount">[]
}

export type InvoiceTotals = {
  readonly subtotal: number
  readonly discount: number
  readonly tax: number
  readonly total: number
  readonly amountPaid: number
  readonly credited: number
  readonly refunded: number
  readonly amountDue: number
}
