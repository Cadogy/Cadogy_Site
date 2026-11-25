import type {
  Address,
  Currency,
  Discount,
  InvoiceStatus,
  LineItem,
  Payment,
} from "./schema"

export const INVOICE_EVENT_TYPES = [
  "created",
  "updated",
  "issued",
  "sent",
  "viewed",
  "reminder_sent",
  "payment_recorded",
  "paid",
  "voided",
  "marked_uncollectible",
  "credited",
  "refunded",
  "disputed",
  "dispute_closed",
] as const

type InvoiceEventType = (typeof INVOICE_EVENT_TYPES)[number]

export type InvoiceEvent = {
  readonly type: InvoiceEventType
  readonly at: Date
  readonly actorId?: string
  readonly detail?: string
}

export const CREDIT_NOTE_KINDS = [
  "refund",
  "invoice_credit",
  "balance_credit",
] as const

export type CreditNoteKind = (typeof CREDIT_NOTE_KINDS)[number]

export const ADJUSTMENT_KINDS = [
  "refund",
  "invoice_credit",
] as const satisfies readonly CreditNoteKind[]

export type InvoiceAdjustment = {
  readonly creditNoteId: string
  readonly number: string
  readonly kind: (typeof ADJUSTMENT_KINDS)[number]
  readonly amount: number
}

export type ClientSnapshot = {
  readonly name: string
  readonly company: string
  readonly email: string
  readonly address: Address
  readonly taxId: string
}

export type Invoice = {
  readonly id: string
  readonly number: string | null
  readonly clientId: string
  readonly clientSnapshot: ClientSnapshot | null
  readonly status: InvoiceStatus
  readonly currency: Currency
  readonly issueDate: Date | null
  readonly dueDate: Date | null
  readonly termsDays: number
  readonly lineItems: readonly LineItem[]
  readonly discount: Discount | null
  readonly taxRateBps: number
  readonly memo: string
  readonly footer: string
  readonly internalNotes: string
  readonly payments: readonly Payment[]
  readonly adjustments: readonly InvoiceAdjustment[]
  readonly events: readonly InvoiceEvent[]
  readonly publicToken: string
}

export type DisplayStatus = InvoiceStatus | "overdue"

export type InvoiceBadge =
  | DisplayStatus
  | "refunded"
  | "partially_refunded"
  | "settled_by_credit"
  | "disputed"

export const invoicePublicPath = (token: string) => `/invoice/${token}`
