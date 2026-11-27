import type { Money, PricingModel, ResolvedPrice } from "../domain/catalog"
import type { AddOn, BillingInterval } from "../domain/recurring"
import type { Currency, LineUnit } from "../domain/schema"

export type CatalogItem = {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly categoryId: string | null
  readonly pricing: PricingModel
  /**
   * Null for hourly services that inherit a category or default rate, and for
   * at-cost expenses whose amount is entered when billed.
   */
  readonly unitAmount: number | null
  /** What one unit is, e.g. "page" or "mailbox"; null for a whole service. */
  readonly unit: string | null
  /** The price is a starting point ("from $1,500"), adjusted per job. */
  readonly priceFrom: boolean
  /** For packages: the catalog services this one includes. */
  readonly includedItemIds: readonly string[]
  /** For packages: hours of work included each billing period. */
  readonly includedHours: number | null
  readonly currency: Currency
  readonly interval: BillingInterval
  readonly archived: boolean
}

export type CatalogCategory = {
  readonly id: string
  readonly name: string
  readonly hourlyRate: Money | null
}

export type PricedCatalogItem = CatalogItem & {
  readonly category: CatalogCategory | null
  /** Null when an hourly service has no rate it can use. */
  readonly price: ResolvedPrice | null
}

export type StoredAddOn = AddOn & {
  readonly catalogItemId: string | null
  readonly startDate: Date
  readonly canceledAt: Date | null
  /**
   * Hours of work included per billing period, per unit. Copied from the
   * catalog when added, so catalog edits never change an existing client.
   */
  readonly includedHours: number | null
}

/** Work logged for a client, covered by a plan's hours or billed. */
export type TimeEntry = {
  readonly id: string
  readonly clientId: string
  readonly date: Date
  readonly hours: number
  readonly description: string
  readonly catalogItemId: string | null
  /** The plan whose included hours covered part or all of this. */
  readonly addOnId: string | null
  readonly includedHours: number
  readonly billedHours: number
  /** Hourly rate used for the billed hours, in minor units. */
  readonly unitAmount: number | null
  readonly currency: Currency
  /** The pending charge for the billed hours, if any. */
  readonly chargeId: string | null
  readonly createdAt: Date
}

export const CHARGE_STATUSES = ["pending", "invoiced", "void"] as const

type ChargeStatus = (typeof CHARGE_STATUSES)[number]

export type Charge = {
  readonly id: string
  readonly clientId: string
  readonly addOnId: string | null
  readonly description: string
  readonly quantity: number
  readonly unitAmount: number
  /** "hour" for logged time, so the invoice line reads "1.5 hours". */
  readonly unit: LineUnit | null
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
  readonly defaultHourlyRate: Money | null
}

export const DEFAULT_SETTINGS: BillingSettings = {
  paymentInstructions: "",
  defaultTaxRateBps: 0,
  reminderOffsets: [-3, 0, 7, 14],
  autoBillEnabled: true,
  defaultHourlyRate: null,
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
  readonly categories: {
    readonly list: () => Promise<CatalogCategory[]>
    readonly find: (id: string) => Promise<CatalogCategory | null>
    readonly insert: (
      category: Omit<CatalogCategory, "id">
    ) => Promise<CatalogCategory>
    readonly save: (category: CatalogCategory) => Promise<CatalogCategory>
    readonly remove: (id: string) => Promise<void>
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
  readonly timeEntries: {
    readonly insert: (entry: Omit<TimeEntry, "id">) => Promise<TimeEntry>
    readonly find: (id: string) => Promise<TimeEntry | null>
    /** Newest first. */
    readonly list: (filter: { clientId: string }) => Promise<TimeEntry[]>
    readonly remove: (id: string) => Promise<void>
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
