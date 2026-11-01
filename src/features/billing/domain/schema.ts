import { z } from "zod"

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
  "other",
] as const

const email = z.string().trim().toLowerCase().pipe(z.email())

const minorUnits = z.number().int().nonnegative().max(1_000_000_000_00)

const quantity = z
  .number()
  .positive()
  .max(1_000_000)
  .refine((value) => Number.isInteger(Math.round(value * 100 * 1e6) / 1e6), {
    message: "Quantity supports at most two decimal places",
  })

export const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity,
  unitAmount: minorUnits,
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
  ccEmails: z.array(email).max(5).default([]),
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
  portalUserEmail: z.union([email, z.literal("")]).default(""),
})

export const invoiceDraftInputSchema = z.object({
  clientId: z.string().min(1),
  currency: z.enum(CURRENCIES),
  termsDays: z.number().int().min(0).max(120),
  lineItems: z.array(lineItemSchema).max(100),
  discount: discountSchema.nullable().default(null),
  taxRateBps: z.number().int().min(0).max(10_000).default(0),
  memo: z.string().trim().max(2_000).default(""),
  footer: z.string().trim().max(1_000).default(""),
  internalNotes: z.string().trim().max(2_000).default(""),
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
type PaymentInput = z.infer<typeof paymentInputSchema>

export type Payment = PaymentInput & { readonly stripeEventId?: string }

export type InvoiceAmounts = {
  readonly lineItems: readonly LineItem[]
  readonly discount: Discount | null
  readonly taxRateBps: number
  readonly payments: readonly Pick<Payment, "amount">[]
}

export type InvoiceTotals = {
  readonly subtotal: number
  readonly discount: number
  readonly tax: number
  readonly total: number
  readonly amountPaid: number
  readonly amountDue: number
}
