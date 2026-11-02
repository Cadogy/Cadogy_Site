import type { Contact } from "../domain/contacts"
import type { Invoice } from "../domain/invoice"
import type { ClientInput, InvoiceStatus } from "../domain/schema"

export type SavedCard = {
  readonly stripeCustomerId: string
  readonly paymentMethodId: string
  readonly brand: string
  readonly last4: string
  readonly expMonth: number
  readonly expYear: number
}

type AutopaySettings = {
  readonly enabled: boolean
  readonly card: SavedCard | null
}

export type BillingClient = ClientInput & {
  readonly id: string
  readonly archivedAt: Date | null
  readonly autoBill: boolean
  readonly autopay: AutopaySettings
  readonly contacts: readonly Contact[]
}

type NewInvoice = Omit<Invoice, "id">

export type InvoiceFilter = {
  readonly status?: InvoiceStatus
  readonly clientIds?: readonly string[]
}

export type BillingRepository = {
  readonly insertClient: (
    client: Omit<BillingClient, "id">
  ) => Promise<BillingClient>
  readonly saveClient: (client: BillingClient) => Promise<BillingClient>
  readonly findClient: (id: string) => Promise<BillingClient | null>
  readonly listClients: (options: {
    includeArchived: boolean
  }) => Promise<BillingClient[]>
  readonly findClientsByEmail: (email: string) => Promise<BillingClient[]>
  readonly insertInvoice: (invoice: NewInvoice) => Promise<Invoice>
  readonly saveInvoice: (invoice: Invoice) => Promise<Invoice>
  readonly deleteInvoice: (id: string) => Promise<void>
  readonly findInvoice: (id: string) => Promise<Invoice | null>
  readonly findInvoiceByToken: (token: string) => Promise<Invoice | null>
  readonly listInvoices: (filter: InvoiceFilter) => Promise<Invoice[]>
  readonly findInvoiceByPaymentIntent: (
    paymentIntentId: string
  ) => Promise<Invoice | null>
  readonly nextSequence: (key: string) => Promise<number>
}

export type BillingNotification = {
  readonly kind: "issued" | "reminder" | "receipt" | "autopay_failed"
  readonly invoice: Invoice
  readonly recipients: readonly string[]
}

export type BillingNotifier = {
  readonly send: (notification: BillingNotification) => Promise<void>
}
