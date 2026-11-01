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
] as const

type InvoiceEventType = (typeof INVOICE_EVENT_TYPES)[number]

export type InvoiceEvent = {
  readonly type: InvoiceEventType
  readonly at: Date
  readonly actorId?: string
  readonly detail?: string
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
  readonly events: readonly InvoiceEvent[]
  readonly publicToken: string
}

export type DisplayStatus = InvoiceStatus | "overdue"

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })
export const fail = <T>(error: string): Result<T> => ({ ok: false, error })
