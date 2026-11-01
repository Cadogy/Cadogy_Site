import type { AddOn, BillingInterval } from "../domain/recurring"
import type { Currency } from "../domain/schema"

export type CatalogItem = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly unitAmount: number
  readonly currency: Currency
  readonly interval: BillingInterval
  readonly archived: boolean
}

export type StoredAddOn = AddOn & {
  readonly catalogItemId: string | null
  readonly startDate: Date
  readonly canceledAt: Date | null
}

type ChargeStatus = "pending" | "invoiced" | "void"

export type Charge = {
  readonly id: string
  readonly clientId: string
  readonly addOnId: string | null
  readonly description: string
  readonly quantity: number
  readonly unitAmount: number
  readonly currency: Currency
  readonly periodStart: Date | null
  readonly periodEnd: Date | null
  readonly status: ChargeStatus
  readonly invoiceId: string | null
  readonly createdAt: Date
}

export type BillingSettings = {
  readonly paymentInstructions: string
  readonly defaultTaxRateBps: number
  readonly reminderOffsets: readonly number[]
  readonly autoBillEnabled: boolean
}

export const DEFAULT_SETTINGS: BillingSettings = {
  paymentInstructions: "",
  defaultTaxRateBps: 0,
  reminderOffsets: [-3, 0, 7, 14],
  autoBillEnabled: true,
}

export type RunSummary = {
  readonly at: Date
  readonly chargesCreated: number
  readonly invoicesIssued: number
  readonly autopayCollected: number
  readonly autopayFailed: number
  readonly remindersSent: number
  readonly errors: readonly string[]
}

export type EngineRepository = {
  readonly catalog: {
    readonly list: (options: {
      includeArchived: boolean
    }) => Promise<CatalogItem[]>
    readonly find: (id: string) => Promise<CatalogItem | null>
    readonly insert: (item: Omit<CatalogItem, "id">) => Promise<CatalogItem>
    readonly save: (item: CatalogItem) => Promise<CatalogItem>
  }
  readonly addOns: {
    readonly insert: (addOn: Omit<StoredAddOn, "id">) => Promise<StoredAddOn>
    readonly save: (addOn: StoredAddOn) => Promise<StoredAddOn>
    readonly find: (id: string) => Promise<StoredAddOn | null>
    readonly list: (filter: {
      clientIds?: readonly string[]
      dueBy?: Date
    }) => Promise<StoredAddOn[]>
  }
  readonly charges: {
    readonly insertIfNew: (charge: Omit<Charge, "id">) => Promise<Charge | null>
    readonly save: (charge: Charge) => Promise<Charge>
    readonly list: (filter: {
      clientId?: string
      status?: ChargeStatus
      ids?: readonly string[]
    }) => Promise<Charge[]>
  }
  readonly settings: {
    readonly get: () => Promise<BillingSettings>
    readonly save: (settings: BillingSettings) => Promise<BillingSettings>
  }
  readonly runs: {
    readonly record: (summary: RunSummary) => Promise<void>
    readonly latest: () => Promise<RunSummary | null>
  }
}

export type ChargeResult =
  | { readonly ok: true; readonly paymentId: string }
  | { readonly ok: false; readonly error: string }

export type PaymentGateway = {
  readonly chargeSavedCard: (request: {
    readonly customerId: string
    readonly paymentMethodId: string
    readonly amount: number
    readonly currency: Currency
    readonly invoiceId: string
    readonly description: string
  }) => Promise<ChargeResult>
}
